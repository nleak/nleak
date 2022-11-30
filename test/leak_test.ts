import { Server as HTTPServer } from 'http';
import createHTTPServer from './util/http_server';
import NLeak from '../core/nleak';
import NodeDriver from '../core/node_driver';
import { equal as assertEqual } from 'assert';
import NopProgressBar from '../core/nop_progress_bar';
import NopLog from '../core/common/nop_log';
import fs from "fs";
import { join } from 'path';
import { IPath } from 'common/interfaces';

const DEBUG = false;

const guest_app_file_name = 'guest_app_test_leak.js';
const wrapper_file_name = 'wrapper.js';
const leak_test_guest_app =
`
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = exports.leaking = void 0;
const http = require('http');
const hostname = '127.0.0.1';
const port = 2333;
//add callable methods by other script aka wrapper.js
global.LEAKOBJ = {};
var power = 2;
function leaking() {
  var top = Math.pow(2, power);
  power++;
  for (var j = 0; j < top; j++) {
    LEAKOBJ[Math.random()] = Math.random();
  }
  console.log("memory leaking...");
}
exports.leaking = leaking;
function clean() {
  LEAKOBJ.clear();
}
exports.clean = clean;
const server = http.createServer((req, res) => {
  if (req.url === "/leak" && req.method === "GET") {
    leaking();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write("leaking() done");
    res.end();
  }
  else if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("hello from sample_app.js");
    res.end();
  }
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});
server.listen(port, hostname, () => {});
`
const leak_test_wrapper =
`
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const Module = require('module');
const originalRequire = Module.prototype.require;

// FIXME: update this wrapper when guest/wrapper.js is available
Module.prototype.require = function(){
  return originalRequire.apply(this, arguments);
  // if (!argv.rewrite) {
  //   return originalRequire.apply(this, arguments);
  // } else {
  //   return originalRequire.apply(this, arguments);
  // }
};

require('./${guest_app_file_name}');
`
describe('Leak test', function () {
  this.timeout(60000);
  let httpServer: HTTPServer;
  let driver: NodeDriver;

  before(async function () {
    console.log = () => {};
    const guest_app_path = join(process.cwd(), guest_app_file_name);
    const wrapper_path = join(process.cwd(), wrapper_file_name);
    fs.writeFileSync(guest_app_path, leak_test_guest_app, { encoding: 'utf-8' });
    fs.writeFileSync(wrapper_path, leak_test_wrapper, { encoding: 'utf-8' });

    driver = await NodeDriver.Launch(NopLog, [], false, false, wrapper_path);
    await driver.takeHeapSnapshot();
  });

  function createStandardLeakTest(description: string, file_name: string, expected_leak: number): void {
    it("should be a leak", async function () {
      const result = await NLeak.FindLeaks(`
      exports.url = "http://127.0.0.1:2333";
      // define entry point of sample-app
      exports.entry="../guest_app_test_leak.js";
      exports.loop = [
      {
          name: "1st Call /leak API",
          endpoint: "http://127.0.0.1:2333/leak",
          check: () => {},
          next: () => {},
      }
      ];
      exports.timeout = 30000;
      exports.iterations = 3;
      exports.postCheckSleep = 100;
      `, new NopProgressBar(), driver, (results) => { }
      );

      fs.writeFile('./test.log', JSON.stringify(result, null, 2), err => {
        if (err) {
          console.error(err);
        }
        // file written successfully
      });

      assertEqual(result.leaks.length >= expected_leak, true);
      let obj: IPath = (result.leaks[0].paths[0]);
      const leak_obj_name = 'LEAKOBJ';
      const leak_obj_retained_size = 2064;
      assertEqual((obj[0].indexOrName), leak_obj_name);
      assertEqual(result.leaks[0].scores.retainedSize, leak_obj_retained_size);

      // console.log("result size : ", result.leaks.length)
      // result.leaks.forEach((leak) => {
      //   console.log(leak.id);
      // });
    });
  }

  createStandardLeakTest('Catches leaks', guest_app_file_name, 1);

  after(function (done) {
    fs.unlink(guest_app_file_name, (err) => {
      if (err) throw err;
      // console.debug('guest_app_test_leak.js was deleted');
    });
    fs.unlink(wrapper_file_name, (err) => {
      if (err) throw err;
    });
    // Shutdown both HTTP server and proxy.
    let e: any = null;
    function wrappedDone() {
      done(e);
    }

    function shutdownProxy() {
      if (driver) {
        wrappedDone();
        process.exit(0);
      } else {
        wrappedDone();
      }
    }

    function shutdownHTTPServer() {
      if (httpServer) {
        httpServer.close((localE: any) => {
          e = localE;
          shutdownProxy();
        });
      } else {
        shutdownProxy();
      }
    }
    DEBUG ? setTimeout(shutdownHTTPServer, 999) : shutdownHTTPServer();
  });
});
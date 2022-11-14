import {Server as HTTPServer} from 'http';
import createHTTPServer from './util/http_server';
import NLeak from '../core/nleak';
import NodeDriver from '../core/node_driver';
import {equal as assertEqual} from 'assert';
import NopProgressBar from '../core/nop_progress_bar';
import NopLog from '../core/common/nop_log';
import fs from "fs";
import { join } from 'path';

const DEBUG = true;

const guest_app_file_name = 'guest_app_test_leak.js';
const wrapper_file_name = 'wrapper.js';
const no_leak_test_guest_app =
`
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = exports.leaking = void 0;
const http = require('http');
const hostname = '127.0.0.1';
const port = 2334;
var obj = {};
var power = 2;
function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
    }
}
exports.leaking = leaking;
function clean() {
    obj.clear();
}
exports.clean = clean;
const server = http.createServer((req, res) => {
    if (req.url === "/leak" && req.method === "GET") {
        leaking();
        clean();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write("leaking() done");
        res.end();
    }
    else if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.write("hello from sample_app.js");
        res.end();
        clean();
    }
    else {
        clean();
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
    }
});
server.listen(port, hostname, () => {});
`
const no_leak_test_wrapper =
`
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const Module = require('module');
const originalRequire = Module.prototype.require;

// FIXME: update this wrapper when guest/wrapper.js is available
Module.prototype.require = function(){
  if (!argv.rewrite) {
    return originalRequire.apply(this, arguments);
  } else {
    return originalRequire.apply(this, arguments);
  }
};

require('./${guest_app_file_name}');
`
describe('No Leak test', function() {
    this.timeout(60000);
    let httpServer: HTTPServer;
    let driver: NodeDriver;
    before(async function() {
      const guest_app_path = join(process.cwd(), guest_app_file_name);
      const wrapper_path = join(process.cwd(), wrapper_file_name);
      fs.writeFileSync( guest_app_path, no_leak_test_guest_app, {encoding:'utf-8'});
      fs.writeFileSync( wrapper_path, no_leak_test_wrapper, {encoding:'utf-8'});
      console.log= () => {};
      driver = await NodeDriver.Launch(NopLog, [], false, false, wrapper_path);
      await driver.takeHeapSnapshot();
    });

    function createStandardNoLeakTest(description: string, file_name: string, expected_leak: number): void {
      it("should not be leak",  async function() {
        const result = await NLeak.FindLeaks(`
        exports.url = "http://127.0.0.1:2334";
        exports.entry="../guest_app_test_no_leak.js";
        exports.loop = [
        {
            name: "1st Call /leak API",
            endpoint: "http://127.0.0.1:2334/leak",
            check: () => {},
            next: () => {},
        }
        ];
        exports.timeout = 30000;
        exports.iterations = 3;
        exports.postCheckSleep = 100;
        `,new NopProgressBar(), driver, (results) => {}
        );

        fs.writeFile('./test.log', JSON.stringify(result, null, 2), err => {
          if (err) {
            console.error(err);
          }
          // file written successfully
        });

        assertEqual(result.leaks.length == expected_leak, true);
        // console.log("result size : ", result.leaks.length)
        // result.leaks.forEach((leak) => {
        //     console.log(leak.id);
        // });
      });
    }

    createStandardNoLeakTest('No leaks', guest_app_file_name, 0);

    after(function(done) {
      fs.unlink(guest_app_file_name, (err) => {
        if (err) throw err;
        // console.debug('guest_app_test_no_leak.js was deleted');
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
          // Driver shutdown is not implemented
          // driver.shutdown().then(wrappedDone, (localE) => {
          //   e = localE;
          //   wrappedDone();
          // });
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

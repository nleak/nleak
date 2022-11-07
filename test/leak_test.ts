import { Server as HTTPServer } from 'http';
import createHTTPServer from './util/http_server';
import NLeak from '../src/nleak';
import NodeDriver from '../src/node_driver';
import { equal as assertEqual } from 'assert';
import NopProgressBar from '../src/nop_progress_bar';
import NopLog from '../src/common/nop_log';
import fs from "fs";
import { join } from 'path';

const DEBUG = false;

const leak_test =
`
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = exports.leaking = void 0;
const http = require('http');
const hostname = '127.0.0.1';
const port = 2333;
//add callable methods by other script aka wrapper.js
var obj = {};
var power = 2;
function leaking() {
  var top = Math.pow(2, power);
  power++;
  for (var j = 0; j < top; j++) {
      obj[Math.random()] = Math.random();
  }
  console.log("memory leaking...");
}
exports.leaking = leaking;
function clean() {
  obj.clear();
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
describe('Leak test', function () {
  this.timeout(60000);
  let httpServer: HTTPServer;
  let driver: NodeDriver;

  before(async function () {
    console.log = () => {};
    fs.writeFileSync(join(process.cwd(), "guest_app_test_leak.js"), leak_test, { encoding: 'utf-8' });

    driver = await NodeDriver.Launch(NopLog, [], false, join(process.cwd(), "guest_app_test_leak.js"));
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
      assertEqual(result.leaks.length >= expected_leak, true);
      // console.log("result size : ", result.leaks.length)
      // result.leaks.forEach((leak) => {
      //   console.log(leak.id);
      // });
    });
  }

  createStandardLeakTest('Catches leaks', 'guest_app_test_leak.js', 1);

  after(function (done) {
    fs.unlink('guest_app_test_leak.js', (err) => {
      if (err) throw err;
      // console.debug('guest_app_test_leak.js was deleted');
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
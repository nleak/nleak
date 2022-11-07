import {Server as HTTPServer} from 'http';
import createHTTPServer from './util/http_server';
import NLeak from '../src/nleak';
import NodeDriver from '../src/node_driver';
import {equal as assertEqual} from 'assert';
import NopProgressBar from '../src/nop_progress_bar';
import NopLog from '../src/common/nop_log';
import fs from "fs";
import { join } from 'path';

const DEBUG = true;

const no_leak_test =
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
describe('No Leak test', function() {
    this.timeout(60000);
    let httpServer: HTTPServer;
    let driver: NodeDriver;
    before(async function() {
      fs.writeFileSync( join(process.cwd(), "guest_app_test_no_leak.js"), no_leak_test, {encoding:'utf-8'});
      console.log= () => {};
      driver = await NodeDriver.Launch(NopLog, [], false, join(process.cwd(), "guest_app_test_no_leak.js"));
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
        console.log(result.leaks.length);
        assertEqual(result.leaks.length == expected_leak, true);
        // console.log("result size : ", result.leaks.length)
        // result.leaks.forEach((leak) => {
        //     console.log(leak.id);
        // });
      });
    }

    createStandardNoLeakTest('No leaks', 'guest_app_test_no_leak.js', 0);

    after(function(done) {
      fs.unlink('guest_app_test_no_leak.js', (err) => {
        if (err) throw err;
        // console.debug('guest_app_test_no_leak.js was deleted');
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

import { Server as HTTPServer } from 'http';
import createHTTPServer from './util/http_server';
import NLeak from '../core/nleak';
import NodeDriver from '../core/node_driver';
import { equal as assertEqual } from 'assert';
import NopProgressBar from '../core/nop_progress_bar';
import NopLog from '../core/common/nop_log';
import fs from "fs";
import { join } from 'path';

const DEBUG = false;
const closure_leak_test =
`
const http = require('http');
const hostname = '127.0.0.1';
const port = 2333;
function leaking() {
  var obj = {};
  var power = 2;
  return {
    createLeak: function() {
      var top = Math.pow(2, power);
      power++;
      for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
      }
      console.log("memory leaking...");
    },
    cleanLeak: function() {
      obj.clear();
    }
  };
}
const server = http.createServer((req, res) => {
  if (req.url === "/leak" && req.method === "GET") {
    const leak_func = leaking();
    leak_func.createLeak();
    leak_func.cleanLeak();
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

describe('Closure No Leak test', function () {
  this.timeout(60000);
  let httpServer: HTTPServer;
  let driver: NodeDriver;

  before(async function () {
    console.log = () => {};
    fs.writeFileSync(join(process.cwd(), "guest_app_closure_test_no_leak.js"), closure_leak_test, { encoding: 'utf-8' });

    driver = await NodeDriver.Launch(NopLog, [], false, join(process.cwd(), "guest_app_closure_test_no_leak.js"));
    await driver.takeHeapSnapshot();
  });

  function createStandardLeakTest(description: string, file_name: string, expected_leak: number): void {
    it("should not be a leak in closure", async function () {
      const result = await NLeak.FindLeaks(`
      exports.url = "http://127.0.0.1:2333";
      // define entry point of sample-app
      exports.entry="../guest_app_closure_test_no_leak.js";
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
    });
  }

  createStandardLeakTest('No closure leaks', 'guest_app_closure_test_no_leak.js', 0);

  after(function (done) {
    fs.unlink('guest_app_closure_test_no_leak.js', (err) => {
      if (err) throw err;
      // console.debug('guest_app_closure_test_no_leak.js was deleted');
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

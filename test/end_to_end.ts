import {Server as HTTPServer} from 'http';
import LeakRoot from '../src/lib/leak_root';
import createHTTPServer from './util/http_server';
import NodeDriver from '../src/lib/node_driver';
import {readFileSync} from 'fs';
import {equal as assertEqual} from 'assert';
import ProgressProgressBar from '../src/lib/progress_progress_bar';
import NopLog from '../src/common/nop_log';
import { timeout } from './example/config';

const HTTP_PORT = 8875;
const DEBUG = false;

interface TestFile {
  mimeType: string;
  data: Buffer;
}

function getHTMLDoc(docStr: string): { mimeType: string, data: Buffer } {
  return {
    mimeType: 'text/html',
    data: Buffer.from(docStr, 'utf8')
  };
}

function getHTMLConfig(name: string): { mimeType: string, data: Buffer } {
  return getHTMLDoc(`<!DOCTYPE html><html><head><title>${name}</title></head><body><button id="btn">Click Me</button><script type="text/javascript" src="/${name}.js"></script></body></html>`);
}

// 'Files' present in the test HTTP server
const FILES: {[name: string]: TestFile} = {
  '/test.html': getHTMLConfig('test'),
  '/test.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`var obj = {};
    var i = 0;
    var power = 2;
    document.getElementById('btn').addEventListener('click', function() {
      var top = Math.pow(2, power);
      power++;
      for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
      }
    });
    `, 'utf8')
  },
  '/closure_test.html': getHTMLConfig('closure_test'),
  '/closure_test.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`(function() {
      var obj = {};
      var i = 0;
      var power = 2;
      window.objfcn = function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj[Math.random()] = Math.random();
        }
      };
    })();
    document.getElementById('btn').addEventListener('click', function() {
      window.objfcn();
    });`)
  },
  '/reassignment_test.html': getHTMLConfig('reassignment_test'),
  '/reassignment_test.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`
    (function() {
      var obj = [];
      var i = 0;
      var power = 2;
      document.getElementById('btn').addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          obj = obj.concat({ val: Math.random() });
        }
      });
    })();
    `, 'utf8')
  },
  '/multiple_paths_test.html': getHTMLConfig('multiple_paths_test'),
  '/multiple_paths_test.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`(function() {
      var obj = {};
      var obj2 = obj;
      var i = 0;
      var power = 2;
      document.getElementById('btn').addEventListener('click', function() {
        var top = Math.pow(2, power);
        power++;
        for (var j = 0; j < top; j++) {
          if (obj === obj2) {
            var target = Math.random() > 0.5 ? obj : obj2;
            target[Math.random()] = Math.random();
          }
        }
      });
    })();
    `, 'utf8')
  },
  '/irrelevant_paths_test.html': getHTMLConfig('irrelevant_paths_test'),
  '/irrelevant_paths_test.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`var obj = {};
    var i = 0;
    var power = 2;
    document.getElementById('btn').addEventListener('click', function() {
      var top = Math.pow(2, power);
      power++;
      for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
      }
      // Adds more properties, but properly deletes them.
      // Not a leak.
      var second = Math.random();
      obj[second] = second;
      delete obj[second];
    });`, 'utf8')
  },
  '/event_listener_leak.html': getHTMLConfig('event_listener_leak'),
  '/event_listener_leak.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`
    // Make unique functions so we can register many listeners.
    function getAddListener() {
      return function() {
        document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener());
      };
    }
    getAddListener()();`, 'utf8')
  },
  '/event_listener_removal.html': getHTMLConfig('event_listener_removal'),
  '/event_listener_removal.js': {
    mimeType: 'text/javascript',
    data: Buffer.from(`
    // Make unique functions so we can register many listeners.
    function getAddListener() {
      return function() {
        document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener()); document.getElementById('btn').addEventListener('click', getAddListener());
      };
    }
    getAddListener()();
    // Responsible function
    document.getElementById('btn').addEventListener('click', function() {
      var b = document.getElementById('btn');
      var l = getAddListener();
      b.addEventListener('click', l);
      b.removeEventListener('click', l);
    });`, 'utf8')
  }
};

describe('End-to-end Tests', function() {
//   // 10 minute timeout.
//   this.timeout(600000);
  let httpServer: HTTPServer;
  let driver: NodeDriver;
  before(async function() {
    httpServer = await createHTTPServer(FILES, HTTP_PORT);
    if (!DEBUG) {
      // Silence debug messages.
      console.debug = () => {};
    }
    driver = await NodeDriver.Launch(NopLog);
  });

  
  
});
function before(arg0: () => Promise<void>) {
	throw new Error('Function not implemented.');
}


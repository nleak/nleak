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

//jest
//mocha

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

describe('End-to-end Tests', function() {
//   // 10 minute timeout.
//   this.timeout(600000);
//   let httpServer: HTTPServer;
  let driver: NodeDriver;
  //todo: input config
  before(async function() {
    // httpServer = await createHTTPServer(FILES, HTTP_PORT);
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


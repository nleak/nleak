import repl from 'repl';
import { parseScript as parseJavaScript } from 'esprima';
import childProcess from 'child_process';
import cdp from 'chrome-remote-interface';

import HeapSnapshotParser from '../lib/heap_snapshot_parser';
import { Log, IDriver } from '../common/interfaces';
import { wait } from '../common/util';

function runUserProcess(absPath: string): childProcess.ChildProcess {
  let node: childProcess.ChildProcess;
  let nodeRemoteDebugger: cdp.Client;

  try {
    const node = childProcess.spawn('node', ['--inspect', absPath]);

    // attach events
    node.on('spawn', async (msg: any) => {
      // spawn successfully
      console.log(`PID[${node.pid}] spawned, will create connect websocket using chrome-remote-interface, msg:${msg}`);
      nodeRemoteDebugger = await cdp({ port: 9229 });
    })
    node.on('message', (msg) => {
      console.log('PARENT got message:', msg);
    });
    node.stdout.on('data', (data) => {
      console.log(`PID[${node.pid}] stdout: ${data}`);
    });
    node.on('close', (code) => {
      console.log(`PID[${node.pid}] child process close all stdio with code ${code}`);
    });
    node.on('exit', (code) => {
      console.log(`PID[${node.pid}] child process exited with code ${code}`);
    });
  } catch (error) {
    console.error("failed to spawn another NodeJS child process");
  }
  return node;
}

export default class NodeDriver implements IDriver {
  public static async Launch(
    log: Log,
    interceptPaths: string[] = [],
    quiet: boolean = true,
  ): Promise<NodeDriver> {
    // TODO: change hardcoded path to be passed from method params
    const path = "/Users/chenxizh/workspace/practium/NLeak/test/example/test_user_app.js";
    const nodeProcess = runUserProcess(path);

    const driver = new NodeDriver(
      log,
      interceptPaths,
      nodeProcess,
    );

    return driver;
  }

  private _log: Log;
  private _interceptPaths: string[];
  private _quiet: boolean;
  private _process: childProcess.ChildProcess;
  private _shutdown: boolean;

  private constructor(
    log: Log,
    interceptPaths: string[],
    nodeProcess: childProcess.ChildProcess,
  ) {
    this._log = log;
    this._interceptPaths = interceptPaths;
    this._process = nodeProcess;
    this._shutdown = false;

    log.log("[DEBUG] in constructor, need use:");
    log.log(this._process + "");
    log.log(this._shutdown + "");
  }

  // dummy API
  public async takeScreenshot(): Promise<Buffer> {
    return new Promise<Buffer>(() => {
      return Buffer.from("takeScreenshot not implemented in Node", "base64");
    });
  }

  // dummy API
  public async navigateTo(url: string): Promise<any> {
    await wait(1);
    return new Promise<void>(() => {});
  }

  public async relaunch(): Promise<NodeDriver> {
    await this.shutdown();
    const driver = await NodeDriver.Launch(
      this._log,
      this._interceptPaths,
      this._quiet
    );
    return driver;
  }

  public async runCode<T>(expression: string): Promise<T> {
    // const e = await this._runtime.evaluate({ expression, returnByValue: true });
    // this._log.debug(`${expression} => ${JSON.stringify(e.result.value)}`);
    // if (e.exceptionDetails) {
    //   return Promise.reject(exceptionDetailsToString(e.exceptionDetails));
    // }
    // return e.result.value;
    console.log("[DEBUG node_driver] runCode<T> need implementation to run: ", expression);
    return new Promise<T>(() => {});
  }

  public takeHeapSnapshot(): HeapSnapshotParser {
    console.log("in takeHeapSnapshot");
    const parser = new HeapSnapshotParser();

    // this._process.send({ action: 'takeSnapShot' })
    // TODO: take & add snapshot
    // parser.addSnapshotChunk(evt.chunk);

    return parser;
  }

  public async debugLoop(): Promise<void> {
    const evalJavascript = (
      cmd: string,
      context: any,
      filename: string,
      callback: (e: any, result?: string) => void
    ): void => {
      try {
        parseJavaScript(cmd);
        this.runCode(cmd)
          .then((result) => {
            callback(null, `${result}`);
          })
          .catch(callback);
      } catch (e) {
        callback(new (<any>repl).Recoverable(e));
      }
    };
    return new Promise<void>((resolve, reject) => {
      const r = repl.start({ prompt: "> ", eval: evalJavascript });
      r.on("exit", resolve);
    });
  }

  public async shutdown(): Promise<void> {
    // this._shutdown = true;
    // await Promise.all([this._process.dispose(), this.mitmProxy.shutdown()]);
    return new Promise<void>(() => {
      return "shutdown needs implementation"
    });
  }
}

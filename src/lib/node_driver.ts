import repl from "repl";
import fs from "fs";
import { setTimeout } from "timers/promises";
import { parseScript as parseJavaScript } from "esprima";
import childProcess from "child_process";
import cdp from "chrome-remote-interface";

//import config here

import HeapSnapshotParser from "../lib/heap_snapshot_parser";
import { Log, IDriver } from "../common/interfaces";
import { wait } from "../common/util";

interface ChildProcessResponse {
  _process: childProcess.ChildProcess;
  _debugger: cdp.Client; // chrome debugger protocol client, ref: https://chromedevtools.github.io/devtools-protocol/1-2/
}

async function runUserProcess(absPath: string): Promise<ChildProcessResponse> {
  return new Promise(function (resolve, reject) {
    let _process: childProcess.ChildProcess;
    let _debugger: cdp.Client;

    try {
      _process = childProcess.spawn("node", ["--inspect", absPath]);

      // attach events
      _process.on("spawn", async () => {
        // spawn successfully
        console.log(
          `PID[${_process.pid}] spawned, will create connect websocket using chrome-remote-interface`
        );
        _debugger = await cdp({ port: 9229 }); // node's default degging port

        resolve({
          _process: _process,
          _debugger: _debugger,
        });
      });
      _process.on("message", (msg) => {
        console.log("PARENT got message:", msg);
      });
      _process.stdout.on("data", (data) => {
        console.log(`PID[${_process.pid}] stdout: ${data}`);
      });
      _process.on("close", (code) => {
        console.log(
          `PID[${_process.pid}] child process close all stdio with code ${code}`
        );
      });
      _process.on("exit", (code) => {
        console.log(
          `PID[${_process.pid}] child process exited with code ${code}`
        );
      });
    } catch (error) {
      console.error("failed to spawn another NodeJS child process");
      reject(error);
    }
  });
}

export default class NodeDriver implements IDriver {
  public static async Launch(
    log: Log,
    interceptPaths: string[] = [],
    quiet: boolean = true,
	configpath: string = "",
  ): Promise<NodeDriver> {
    const path = configpath;
    const { _process, _debugger } = await runUserProcess(path);

    const driver = new NodeDriver(log, interceptPaths, _process, _debugger);

    return driver;
  }

  private _log: Log;
  private _interceptPaths: string[];
  private _quiet: boolean;
  private _process: childProcess.ChildProcess;
  private _debugger: cdp.Client;
  private _shutdown: boolean;

  private constructor(
    log: Log,
    interceptPaths: string[],
    _process: childProcess.ChildProcess,
    _debugger: cdp.Client
  ) {
    this._log = log;
    this._interceptPaths = interceptPaths;
    this._process = _process;
    this._debugger = _debugger;
    this._shutdown = false;
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
    console.log(
      "[DEBUG node_driver] runCode<T> need implementation to run: ",
      expression
    );
    return new Promise<T>(() => {});
  }

  public async takeHeapSnapshot(): Promise<HeapSnapshotParser> {
    console.log("in takeHeapSnapshot");
    const parser = new HeapSnapshotParser();
    let count = 1;

    // 200 KB chunks
    this._debugger.HeapProfiler.on("addHeapSnapshotChunk", (evt) => {
      fs.writeFileSync("data.heap", JSON.stringify(evt.chunk));
      console.log(`add No.${count} 200KB chunk`);
      count++;
      parser.addSnapshotChunk(evt.chunk);
    });

    // taking a real snapshot.
    await this._debugger.HeapProfiler.takeHeapSnapshot({
      reportProgress: false,
    });

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
      return "shutdown needs implementation";
    });
  }
}

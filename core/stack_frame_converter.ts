import { SourceMapConsumer, RawSourceMap } from "source-map";
import BLeakResults from "./results";
import { IStack } from "./common/interfaces";
import ErrorStackParser from "error-stack-parser";
import fs from "node:fs";

const rewrittenFilePath = "/tmp/nleak_rewritten.js";
const magicString = "//# sourceMappingURL=data:application/json;base64,";
const HACKING_URL_HOST = "http://nleak.js.org/"; // TODO: remove URL in nleak-viewer and use file path instead, then remove this

/**
 * Converts stack frames to get the position in the original source document.
 * Strips any frames from the given agent string.
 */
export default class StackFrameConverter {
  private _maps = new Map<string, SourceMapConsumer>();

  /**
   * Converts the raw stack frames from the BLeak-instrumented source code of the application to the
   * application's original source code.
   *
   * Stores relevant StackFrame / source file data into the `results` object, and returns the stack frames
   * in results format.
   * @param proxy
   * @param pageUrl
   * @param results
   * @param traces
   * @param agentUrl
   */
  public static ConvertGrowthStacks(
    pageUrl: string,
    results: BLeakResults,
    traces: GrowingStackTraces,
  ): { [id: number]: IStack[] } {
    console.log(`Converting stacks... pageUrl=${pageUrl}`);
    return new StackFrameConverter(results).convertGrowthStacks(traces);
  }

  constructor(private _results: BLeakResults) {}

  private _getSourceMap(url: string): void {
    if (typeof url !== "string") {
      console.log("ERR: _getSourceMap input filename is not a string");
      return;
    }
    let map = this._maps.get(url);
    if (!map) {
      try {
        // NOTE from NLeak dev:
        // currently only support the single rewritten file source map
        // if there is a need to support multiple source maps, we need to change the logic here
        // to read multiple source maps files from the file system
        const source = fs.readFileSync(rewrittenFilePath).toString();
        let sourceMapOffset = source.lastIndexOf(magicString);
        if (sourceMapOffset > -1) {
          sourceMapOffset += magicString.length;
          const sourceMapBase64 = source.slice(sourceMapOffset);
          const sourceMapString = new Buffer(
            sourceMapBase64,
            "base64"
          ).toString("utf8");
          const sourceMap: RawSourceMap = JSON.parse(sourceMapString);
          const consumer = new SourceMapConsumer(sourceMap);
          this._maps.set(url, consumer);
          if (sourceMap.sourcesContent && sourceMap.sourcesContent.length > 0) {
            const len = sourceMap.sourcesContent.length;
            for (let i = 0; i < len; i++) {
              this._results.addSourceFile(
                url,
                "text/javascript", // TODO: could be other content types
                sourceMap.sourcesContent[i]
              );
            }
          }
        } else {
          this._results.addSourceFile(
            url,
            "text/javascript", // TODO: could be other content types
            source
          );
        }
      } catch (e) {
        // Failed to get map.
        console.error(`Failed to get source map for ${url}:`);
        console.error(e);
      }
    }
  }

  public convertGrowthStacks(traces: GrowingStackTraces): { [id: number]: IStack[] } {
    // First pass: Get all unique URLs and their source maps.
    const urls = new Set<string>();
    const rawStacks = new Map<string, StackFrame[]>();

    function frameFilter(f: StackFrame): boolean {
      return (
        // NOTE: comment out agentUrl check for now since NLeak doesn't have agentUrl
        // BLeak is filtering out frames from the agentUrl which makes sense.
        // If the results in NLeak has agent related frames, we should filter them out later.
        // (!f.fileName || f.fileName.indexOf(agentUrl) === -1)
        // && (
          !f.functionName ||
          // (
            f.functionName.indexOf("eval") === -1
          // && f.functionName.indexOf(agentUrl) === -1))
      );
    }

    function processFrame(f: StackFrame) {
      if (f.fileName && !f.fileName.toLowerCase().startsWith("http")) { // TODO: remove enforce URL after nleak-viewer is updated
        f.fileName = HACKING_URL_HOST + f.fileName;
      }
      urls.add(f.fileName);
    }

    function processStack(s: string): void {
      console.log(`>>> Will processStack=${s}`);
      if (!rawStacks.has(s)) {
        let frames = ErrorStackParser.parse(<any>{ stack: s });
        frames = frames.filter(frameFilter);
        frames.forEach(processFrame);
        rawStacks.set(s, frames);
      }
    }

    // Step 1: Collect all URLs.
    Object.keys(traces).forEach((stringId) => {
      const id = parseInt(stringId, 10);
      console.log(`Processing stack ${id}: stringId=${stringId}`);
      traces[id].forEach(processStack);
    });

    // Step 2: Get files, parse source maps.
    urls.forEach((url) => {
      console.log(`Getting source map for ${url}`);
      this._getSourceMap(url);
    });
    console.log(`>>> after getSourceMap _maps=${JSON.stringify(this._maps.get("./test_apps/app_1.js"), null, 2)}`);

    // Step 3: Convert stacks.
    const convertedStacks = new Map<string, IStack>();
    rawStacks.forEach((stack, k) => {
      convertedStacks.set(k, this._convertStack(stack));
    });
    // console.log(`Converted stacks=${JSON.stringify(convertedStacks, null, 2)}`);

    // Step 4: Map stacks back into the return object.
    function mapStack(s: string): IStack {
      return convertedStacks.get(s);
    }
    const rv: { [id: number]: IStack[] } = {};
    Object.keys(traces).forEach((stringId) => {
      const id = parseInt(stringId, 10);
      rv[id] = traces[id].map(mapStack);
    });

    // console.log(`Returning stacks=${JSON.stringify(rv, null, 2)}`);
    return rv;
  }

  private _convertStack(stack: StackFrame[]): IStack {
    // console.log(`in _convertStack=${JSON.stringify(stack, null, 2)}`);
    return stack.map((frame) => this._convertStackFrame(frame));
  }

  private _convertStackFrame(frame: StackFrame): number {
    console.log(`in _convertStackFrame, fileName=${frame.fileName}`);
    const map = this._maps.get(frame.fileName);
    if (!map) {
      return this._results.addStackFrameFromObject(frame);
    }
    const ogPos = map.originalPositionFor({
      line: frame.lineNumber,
      column: frame.columnNumber,
    });
    frame.lineNumber = ogPos.line;
    frame.columnNumber = ogPos.column;
    return this._results.addStackFrameFromObject(frame);
  }
}

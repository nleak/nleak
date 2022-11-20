import { SourceMapConsumer, RawSourceMap } from "source-map";
// import { StackFrame, parse as ErrorStackParser } from "error-stack-parser";
import { resolve as resolveURL } from "url";
import BLeakResults from "./results";
import { IStack } from "./common/interfaces";
import ErrorStackParser from "error-stack-parser";

const magicString = "//# sourceMappingURL=data:application/json;base64,";

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
    return new StackFrameConverter(results).convertGrowthStacks(
      // {}, // TODO: to be removed
      // pageUrl,
      traces,
      // "foo" // TODO: to be removed
    );
  }

  constructor(private _results: BLeakResults) {}

  private _fetchMap(proxy: any, url: string): void {
    if (typeof url !== "string") {
      return;
    }
    let map = this._maps.get(url);
    if (!map) {
      try {
        const stashedItem = proxy.getFromStash(url);
        const source = stashedItem.data.toString();
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
                stashedItem.isJavaScript ? "text/javascript" : "text/html",
                sourceMap.sourcesContent[i]
              );
            }
          }
        } else {
          this._results.addSourceFile(
            url,
            stashedItem.isJavaScript ? "text/javascript" : "text/html",
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

  public convertGrowthStacks(
    // proxy: any,
    // pageUrl: string,
    traces: GrowingStackTraces,
    // agentUrl: string
  ): { [id: number]: IStack[] } {
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
      // NOTE: NLeak doesn't have http or https in the url
      // if (f.fileName && !f.fileName.toLowerCase().startsWith("http")) {
      //   f.fileName = resolveURL(pageUrl, f.fileName);
      // }
      urls.add(f.fileName);
    }

    function processStack(s: string): void {
      console.log(`>>> Will processStack=${s}`);
      if (!rawStacks.has(s)) {
        let frames = ErrorStackParser.parse(<any>{ stack: s });
        console.log(`>>> frames=${frames}`);
        frames = frames.filter(frameFilter);
        frames.forEach(processFrame);
        rawStacks.set(s, frames);
        console.log(`>>> rawStacks=${rawStacks}`);
      }
    }

    // Step 1: Collect all URLs.
    Object.keys(traces).forEach((stringId) => {
      const id = parseInt(stringId, 10);
      console.log(`Processing stack ${id}: stringId=${stringId}`);
      traces[id].forEach(processStack);
    });
    // Step 2: Get files, parse source maps.
    // urls.forEach((url) => {
    //   this._fetchMap(proxy, url);
    // });
    // Step 3: Convert stacks.
    const convertedStacks = new Map<string, IStack>();
    rawStacks.forEach((stack, k) => {
      convertedStacks.set(k, this._convertStack(stack));
    });
    console.log(`Converted stacks=${JSON.stringify(convertedStacks, null, 2)}`);
    // Step 4: Map stacks back into the return object.
    function mapStack(s: string): IStack {
      return convertedStacks.get(s);
    }
    const rv: { [id: number]: IStack[] } = {};
    Object.keys(traces).forEach((stringId) => {
      const id = parseInt(stringId, 10);
      rv[id] = traces[id].map(mapStack);
    });

    console.log(`Returning stacks=${JSON.stringify(rv, null, 2)}`);
    return rv;
  }

  private _convertStack(stack: StackFrame[]): IStack {
    console.log(`in _convertStack=${JSON.stringify(stack, null, 2)}`);
    return stack.map((frame) => this._convertStackFrame(frame));
  }

  private _convertStackFrame(frame: StackFrame): number {
    console.log(`in _convertStackFrame=${JSON.stringify(frame, null, 2)}`);
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

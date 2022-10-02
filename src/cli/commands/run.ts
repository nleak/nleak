import {
  readFileSync,
  mkdirSync,
  existsSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { CommandModule } from "yargs";

import ProgressProgressBar from "../../lib/progress_progress_bar";
import { IDriver } from "../../common/interfaces";
import BLeakResults from "../../lib/bleak_results";
import NodeDriver from "../../lib/node_driver";

// import BLeak from "../../lib/bleak";
// import TextReporter from "../../lib/text_reporter";
// import { createGzip } from "zlib";

// import ProgressProgressBar from "../../lib/progress_progress_bar";

const Run: CommandModule = {
  command: "run",
  describe: `Runs NLeak to locate, rank, and diagnose memory leaks in a NodeJS application.`,
  handler: (args: any) => {
    if (!existsSync(args.out)) {
      mkdirSync(args.out);
    }
    if (args.snapshot) {
      if (!existsSync(join(args.out, "snapshots"))) {
        mkdirSync(join(args.out, "snapshots"));
      }
      mkdirSync(join(args.out, "snapshots", "leak_detection"));
    }

    const progressBarLogger = new ProgressProgressBar(
      args.debug,
      args["produce-time-log"]
    );

    // Add stack traces to Node warnings.
    // https://stackoverflow.com/a/38482688
    process.on("warning", (e: Error) => progressBarLogger.error(e.stack));

    let nodeDriver: IDriver;
    async function main() {
      const configFileSource = readFileSync(args.config).toString();

      let shuttingDown = false;
      async function shutDown() {
        if (shuttingDown) {
          return;
        }
        shuttingDown = true;
        // if (nodeDriver) {
        //   await nodeDriver.shutdown();
        // }
        // All sockets/subprocesses/resources *should* be closed, so we can just exit.
        process.exit(0);
      }

      // Shut down gracefully on CTRL+C.
      process.on("SIGINT", async function () {
        console.log(`CTRL+C received.`);
        shutDown();
      });

      const bleakResultsOutput = join(args.out, "bleak_results.json");
      let bleakResults: BLeakResults | null;
      if (existsSync(bleakResultsOutput)) {
        console.log(`Resuming using data from ${bleakResultsOutput}`);
        try {
          bleakResults = BLeakResults.FromJSON(
            JSON.parse(readFileSync(bleakResultsOutput).toString())
          );
        } catch (e) {
          throw new Error(
            `File at ${bleakResultsOutput} exists, but is not a valid BLeak results file: ${e}`
          );
        }
      }

      writeFileSync(join(args.out, "config.js"), configFileSource);

      nodeDriver = await NodeDriver.Launch(
        progressBarLogger,
        [],
        true
      );

      // Test driver snippet, need to removed
      nodeDriver.takeHeapSnapshot();

      // belows start the BLeak FindLeaks logic
      // let i = 0;
      // BLeak.FindLeaks(
      //   configFileSource,
      //   progressBarLogger,
      //   nodeDriver,
      //   (results) => {
      //     writeFileSync(bleakResultsOutput, JSON.stringify(results));
      //     const resultsLog = TextReporter(results);
      //     writeFileSync(join(args.out, "bleak_report.log"), resultsLog);
      //   },
      //   (sn) => {
      //     if (args.snapshot) {
      //       const str = createWriteStream(
      //         join(
      //           args.out,
      //           "snapshots",
      //           "leak_detection",
      //           `snapshot_${i}.heapsnapshot.gz`
      //         )
      //       );
      //       i++;
      //       const gz = createGzip();
      //       gz.pipe(str);
      //       sn.onSnapshotChunk = function (chunk, end) {
      //         gz.write(chunk);
      //         if (end) {
      //           gz.end();
      //         }
      //       };
      //     }
      //     return Promise.resolve();
      //   },
      //   bleakResults
      // )
      //   .then((results) => {
      //     writeFileSync(bleakResultsOutput, JSON.stringify(results));
      //     const resultsLog = TextReporter(results);
      //     writeFileSync(join(args.out, "bleak_report.log"), resultsLog);
      //     if (args["produce-time-log"]) {
      //       writeFileSync(
      //         join(args.out, "time_log.json"),
      //         JSON.stringify(progressBarLogger.getTimeLog())
      //       );
      //     }
      //     console.log(`Results can be found in ${args.out}`);
      //     return shutDown();
      //   })
      //   .catch((e) => {
      //     progressBarLogger.error(`${e}`);
      //     return shutDown();
      //   });
    }

    main();
  },
  builder: {
    out: {
      type: "string",
      demand: true,
      describe: "Directory to output leaks and source code to",
    },
    config: {
      type: "string",
      demand: true,
      describe: "Configuration file to use with BLeak",
    },
    snapshot: {
      type: "boolean",
      default: false,
      describe: "Save heap snapshots into output folder",
    },
    debug: {
      type: "boolean",
      default: false,
      describe: "Print debug information to console during run",
    },
    "produce-time-log": {
      type: "boolean",
      default: false,
      describe:
        "[DEBUG] If set, produces a JSON time log to measure BLeak's overhead.",
    },
  },
};

export default Run;

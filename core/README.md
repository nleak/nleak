# Core Folder Docs

Overview of project files.

<!-- ## Description

An in-depth paragraph about your project and overview of use.

## Getting Started -->

### growth_graph.ts
* Build a growth graph with conversion functions (e.g., `to_Path`) and algorithms (e.g.,`propagateGrowth`, `findLeakPaths`, `CalculateLeakShare`)
### heap_snapshot_parser.ts
* Parse the heap snapshot from upsource and produce a JSON-like format snapshot output that shows
the leaking objects
### leak_root.ts
* Represents a leak root in a BLeak report.
### nleak.ts
* The entrypoint of the entire program, which aims to find leaks in applications. It containins core function `findAndDiagnoseLeaks`, an end-to-end BLeak algorithm, which Locates memory leaks on the page and diagnoses them. 

### node_driver.ts
* Node_driver aims to run and handle various user processes such as `takeHeapSnapshot`,  `navigateTo`,
`relaunch`, `callEndpoint`, etc. 
### nop_progress_bar.ts
*  A progress bar that does nothing.
### operations.ts
* The operations class that contains definitions of all operations, e.g.,`ConfigureRewriteOperation`, `ProgramRunOperation`, `GetGrowthStacksOperation`, etc., following composite design pattern. It also contains an integrated function `findAndDiagnoseLeaks` that wraps up all operation functions. 
### path_to_string.ts
* Convert a path as a human-friendly string.
### progress_bar.ts
* A ProgressBar, using the '`progress`' npm package.
### results.ts
*  Contains the results from a BLeak run; Compacts the results into a new `BLeakResults` object.
### stack_frame_converter.ts
* Converts stack frames to get the position in the original source document.
Strips any frames from the given agent string.
### text_reporter.ts
* Given a set of BLeak results, prints a human-readable text report.
### cli/commands/run.ts
* Runs NLeak to locate, rank, and diagnose memory leaks in a NodeJS application.
### cli/nleak.ts
* yargs command line, using yargs library
### common/console_log.ts 
* Adapter from Log interface to the console interface.
### common/extensions.ts
* Contains types shared between BLeak agent and the rest of the program. These are globally accessible throughout the codebase, and prevent us from needing to use JavaScript
modules for the BLeak agent.
### common/interfaces.ts 
* Interface for classes and enum types
### common/time_log.ts
* `Time Log` class
### common/util.ts
* Time tracker class used in timer log

<!-- ### Installing

* How/where to download your program
* Any modifications needed to be made to files/folders

### Executing program

* How to run the program
* Step-by-step bullets
```
code blocks for commands
```

## Help

Any advise for common problems or issues.
```
command to run if program contains helper info
```

## Authors

Contributors names and contact info

ex. Dominique Pizzie  
ex. [@DomPizzie](https://twitter.com/dompizzie)

## Version History

* 0.2
    * Various bug fixes and optimizations
    * See [commit change]() or See [release history]()
* 0.1
    * Initial Release -->


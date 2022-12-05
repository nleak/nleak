# Test Folder Docs

Overview of project files.

<!-- ## Description

An in-depth paragraph about your project and overview of use.

## Getting Started -->

### agent_transform_test.ts
* Wrapper class for agent_transform_test
### closure_leak_test.ts
* Wrapper class that link `guest_app_closure_test_leak.js` that create a standard closure test. Result should reveal the leaks.
### closure_no_leak_test.ts
* Wrapper class that link `guest_app_closure_test_no_leak.js` that create a standard closure test. Result should not reveal any leaks.
### closure_state_transform_test.ts
* Test explose closure by defining variable `closure_exp` and `exposeClosureState` 
### leak_test.ts
* Define a standard leak test, function `createStandardLeakTest()`, and wrap the test module.
### no_leak_test.ts
* Define a standard no-leak test, function `createStandardNoLeakTest()`, and wrap the test module.
### util/http_server.ts
* Define the http-server function `sendResponse` and `createSimpleServer` from `createHTTPServer` and `HTTPServer` library.

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

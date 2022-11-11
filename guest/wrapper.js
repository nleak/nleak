var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

const Module = require('module');
const fs = require('fs');
const originalRequire = Module.prototype.require;
const exposeClosureState = require("./rewriting/closure_state_transform").exposeClosureState;

// Before transforming the guest app, we need to require the global agent functions
// for code instrumentation.
require("./rewriting/nleak_agent.js");

// Modify the require function to rewrite the guest app
Module.prototype.require = function(){
  if (!argv.rewrite) {
    console.log('Not rewriting guest app');
    return originalRequire.apply(this, arguments);
  }
  console.log('Will rewrite guest app');
  const fileName = arguments['0'];
  try {
    const filePath = require.resolve(fileName);
    if (!fs.existsSync(filePath)) {
      throw "Non-local module required.";
    }
    const srcStr = fs.readFileSync(filePath).toString();

    // rewriting starts here
    const rewritten = exposeClosureState("guest_app_rewritten.js", srcStr);
    fs.writeFile("./guest_app_rewritten.log", rewritten, function (err) {
      if (err) return console.log(err);
      console.log(
        "[DEBUG] saved rewritten guest app to guest_app_rewritten.log"
      );
    });

    // export to file
    const constructor = new module.constructor();
    constructor._compile(rewritten, fileName);
    return constructor.exports;
  } catch {
    return originalRequire.apply(this, arguments);
  }
};

// test instrumental function works on guest app
$$$TEST_OUTPUT$$$();
// run the guest app after rewriting.
require('./guest_app.js');

var argv = require('yargs/yargs')(process.argv.slice(2)).argv;

const Module = require('module');
const fs = require('fs');
const originalRequire = Module.prototype.require;
const exposeClosureState = require("./rewriting/closure_state_transform").exposeClosureState;

// Before transforming the guest app, we need to require the global agent functions
// for code instrumentation.
global.agent = require("./rewriting/nleak_agent.js");

// Modify the require function to rewrite the guest app
Module.prototype.require = function(){
  if (!argv.rewrite) {
    console.log('Not rewriting guest app');
    return originalRequire.apply(this, arguments);
  }
  const fileName = arguments['0'];
  try {
    const filePath = require.resolve(fileName);
    if (!fs.existsSync(filePath)) {
      throw "Non-local module required.";
    }
    const srcStr = fs.readFileSync(filePath).toString();

    // rewriting starts here
    const rewritten = exposeClosureState("guest_app_rewritten.js", srcStr);
    fs.writeFile("/tmp/nleak_rewritten.js", rewritten, function (err) { // write to tmp file for result source mapping
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
$$$AGENT_PRINT$$$("agent $$$ function ready for code instrumentation");
console.log("agent $$$GLOBAL$$$", $$$GLOBAL$$$);

// rewrite and run the guest app.
global.__nleak__ = require('./test_apps/app_1.js');

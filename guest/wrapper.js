const Module = require('module');
const fs = require('fs')
const originalRequire = Module.prototype.require;
const exposeClosureState = require("./rewriting/closure_state_transform").exposeClosureState;

// Modify the require function to rewrite the guest app
Module.prototype.require = function(){
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

// run the guest app after rewriting.
require('./guest_app.js');

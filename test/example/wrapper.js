const Module = require('module');
const fs = require('fs')
const originalRequire = Module.prototype.require;

Module.prototype.require = function(){
  const fileName = arguments['0'];
  try {
    const filePath = require.resolve(fileName);
    if (!fs.existsSync(filePath)) {
        throw 'Non-local module required.';
    }
    const srcStr = fs.readFileSync(filePath).toString();
    const constructor = new module.constructor();
    constructor._compile(srcStr.replace('memory leaking...', 'no leaking...'), fileName);
    return constructor.exports;
  } catch {
    return originalRequire.apply(this, arguments);
  }
};

const guestApp = require('./guest_app.js');

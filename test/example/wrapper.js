//after canchen/wenting done their parts, theyll change rewritingOn
//runnable nodejs script which will call the sample_app.js
//export funcs from sample_app.js

import { leaking } from './guest_app';

//issues: path, wrapper, config

const { boolean } = require('yargs');
const agent = require('./agent');

var rewritingOn = new Boolean(false);
const app = rewritingOn ? own_require(sample.app) : require(sample.app);

for(let i=0;i<10;i++){
	leaking();
}
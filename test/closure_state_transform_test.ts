import { exposeClosureState } from "../src/lib/rewriting/closure_state_transform";
// import {SourceMapGenerator, SourceMapConsumer, RawSourceMap} from 'source-map';

// const sourceMap = new SourceMapGenerator({});
let source =
`
var obj = {};
var power = 2;
function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
    }
}`

let colsure_exp =
`
const test = 1;
function makeFunc() {
  const name = 'Mozilla';
  function displayName() {
    console.log(name);
  }
  return displayName;
}

const myFunc = makeFunc();
myFunc();
`;

console.log(exposeClosureState("result.js", colsure_exp));

// console.log(exposeClosureStateInternal("", "example/test.js", sourceMap, ));
// console.log(exposeClosureState("", "example/test.js"));


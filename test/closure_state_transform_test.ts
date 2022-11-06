import { exposeClosureState } from "../src/lib/rewriting/closure_state_transform";

let colsure_exp =
`
const test = 1;
function makeFunc() {
  const name = 'Mozilla';
  function displayName() {
    if (name === "foo") {
      console.log("foo");
    }
    eval("console.log(name)");
    console.log(name);
  }
  return displayName;
}

const myFunc = makeFunc();
myFunc();
`;

console.log(exposeClosureState("result.js", colsure_exp));

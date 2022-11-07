import { test } from "../guest/rewriting/nleak_agent_transform";

// console.log(test());

const f = Function("F,a", "return new F(a[0])");
//console.log(f.toString());
// console.log(typeof f);

// console.log(Function.prototype.bind.toString());

// const testCase = {
//   x: 42,
//   getX: function () {
//     return this.x;
//   },
// };


// const unboundGetX = testCase.getX;
// console.log(typeof unboundGetX);
// console.log(unboundGetX.prototype.toString());

// const boundGetX = unboundGetX.bind(testCase, null);
// console.log(boundGetX.prototype.bind.toString());

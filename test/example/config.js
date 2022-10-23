exports.url = "http://localhost:3000";

//define entry point of sample-app
module.exports={
	entry:"./sample_app.js",
};

// // Due to throttling (esp. when browser is in background), it may take longer
// // than anticipated for the click we fire to actually run. We want to make
// // sure all snapshots occur after the click processes.
// var startedClickCount = 0;
// var completedClickCount = 0;
// //one step
// exports.loop = [
//   {
//     name: "Click Button",
//     check: function () {
//       return (
//         document.readyState === "complete" &&
//         startedClickCount === completedClickCount
//       );
//     },
//     next: function () {
//       startedClickCount++;
//       if (completedClickCount === 0) {
//         document.getElementById("btn").addEventListener("click", function () {
//           completedClickCount++;
//         });
//       }
//       document.getElementById("btn").click();
//     },
//   },
// ];
// exports.timeout = 30000;
// exports.iterations = 3;
// exports.postCheckSleep = 100;

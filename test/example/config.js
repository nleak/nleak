exports.url = "http://localhost:2333";

//define entry point of sample-app
exports.entry="./sample_app.js";


exports.loop = [
  {
    name: "1st Call /leak API",
    endpoint: "http://localhost:2333/leak",
    check: () => {},
    next: () => {},
  }
];
exports.timeout = 30000;
exports.iterations = 2;
exports.postCheckSleep = 100;


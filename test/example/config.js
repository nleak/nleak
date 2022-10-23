exports.url = "http://localhost:2333";

exports.loop = [
  {
    name: "Call /leak API",
    endpoint: "http://localhost:2333/leak",
    check: () => {},
    next: () => {},
  },
];
exports.timeout = 30000;
exports.iterations = 3;
exports.postCheckSleep = 100;
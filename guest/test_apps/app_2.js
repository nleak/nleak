const http = require('http');

const hostname = '127.0.0.1';
const port = 2333;

//add callable methods by other script aka wrapper.js
// var theThing = null;
// var leaking = function () {
//   var originalThing = theThing;
//   var unused = function () {
//     if (originalThing) console.log("hi");
//   };
//   theThing = {
//     longStr: new Array(100000).join("*"),
//     someMethod: function () {
//       console.log(someMessage);
//     },
//   };
// };

const server = http.createServer((req, res) => {
  if (req.url === "/leak" && req.method === "GET") {
    // leaking();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.write("leaking() done from app 2");
    res.end();
  } else if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("hello from sample_app.js");
    res.end();
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/, with API /leak`);
});
const http = require('http');

const hostname = '127.0.0.1';
const port = 2333;

var obj = {};
var power = 2;
function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
    }
    console.log("memory leaking...");
}

const server = http.createServer((req, res) => {
  if (req.url === "/leak" && req.method === "GET") {
    leaking();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.write("leaking() done");
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
    console.log(`Server running at http://${hostname}:${port}/`);
});
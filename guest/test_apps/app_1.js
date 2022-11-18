const http = require('http');

const hostname = '127.0.0.1';
const port = 2333;

global.LEAKOBJ = {};
var power = 5;
function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
      LEAKOBJ[Math.random()] = Math.random();
    }
}

// arrow function binding
function serve(req, res) {
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
}
const server = http.createServer(serve);

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/, with API /leak`);
});
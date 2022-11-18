const http = require('http');

const hostname = '127.0.0.1';
const port = 2333;

global.LEAKOBJ = {};
global.LEAKOBJ2 = LEAKOBJ;
var power = 5;
function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
      if (global.LEAKOBJ === global.LEAKOBJ2) {
        var target = Math.random() > 0.5 ? global.LEAKOBJ : global.LEAKOBJ2;
        target[Math.random()] = Math.random();
      }
    }
}

const server = http.createServer((req, res) => {
  if (req.url === "/leak" && req.method === "GET") {
    leaking();

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
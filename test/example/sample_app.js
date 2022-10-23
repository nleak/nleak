const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

//add callable methods by other script aka wrapper.js

var obj = {};
var power = 2;
export function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
        obj[Math.random()] = Math.random();
		console.log("in loop");
    }
}

const server = http.createServer((req, res) => {
    // call leaking
    leaking();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('run leaking() done');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
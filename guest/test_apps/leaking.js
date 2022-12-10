const LEAKOBJ = {}
var power = 2;

function leaking() {
    var top = Math.pow(2, power);
    power++;
    for (var j = 0; j < top; j++) {
      LEAKOBJ[Math.random()] = Math.random();
    }
    console.log("memory leaking...");
}

module.exports = leaking
// module.exports = leaking
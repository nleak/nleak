const { MongoClient } = require('mongodb');
const http = require('http');
const {DBUSER,DBPASS,DBNAME} = require('./credentials');

const url = `mongodb+srv://${DBUSER}:${DBPASS}@cluster67369.udoxxke.mongodb.net/?appName=mongosh+1.6.0`
const client = global.client = new MongoClient(url);
const hostname = '127.0.0.1';
const port = 2333;


async function dbtest() {
  await client.connect();

  console.log('Connected successfully to server');

  const db = client.db(DBNAME);

  try {
    let results
    switch(DBNAME){
      case "sample_training":
          results = await testSampleTraining(db);
          break;
      default:
          console.log("not implemented");
    }
    return results
  } catch (e) {
    return e
  }
}

async function testSampleTraining(db) {
    let collection = db.collection('zips');
    let docs = await collection.find({"state": "NY"}, {limit: 10, sort: {pop:-1}}).toArray();

    console.log(`received ${docs.length} documents from zips`);

    if (!docs.length) {
        return [];
    }

    const zips = docs.slice(0, 1000);
    collection = db.collection('inspections');
    const inspections = [];

    for (let z of zips) {
      docs = await collection.find({
        "address.zip": parseInt(z.zip),
      }).toArray();
      inspections.push(...docs);
    }

    return inspections;
}

global.server = http.createServer((req, res) => {
  if (req.url === "/leak" && req.method === "GET") {
    dbtest()
    .then(data => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write(JSON.stringify(data));
    })
    .catch(e => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.write(e.toString());
    }) 
    .finally(() => {
      res.end();
    });
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

server.on('close', () => {
  client.close();
});

module.exports = server;

const { MongoClient } = require('mongodb');
const {DBUSER,DBPASS} = require('./credentials');

const url = `mongodb+srv://${DBUSER}:${DBPASS}@cluster67369.udoxxke.mongodb.net/?appName=mongosh+1.6.0`

const client = global.client = new MongoClient(url);

// Database Name
const dbName = 'myProject';

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('documents');

  // the following code examples can be pasted here...

  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());
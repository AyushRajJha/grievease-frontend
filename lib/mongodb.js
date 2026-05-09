import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'grievease';

let cachedClientPromise = globalThis.__grievEaseMongoPromise;

if (!cachedClientPromise) {
  const client = new MongoClient(uri);
  cachedClientPromise = client.connect();
  globalThis.__grievEaseMongoPromise = cachedClientPromise;
}

export async function getMongoClient() {
  return cachedClientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}


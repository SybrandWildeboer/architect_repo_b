import { MongoClient, Db } from 'mongodb';
import { config } from '../config';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo() {
  if (!client) {
    let connected = false;
    let attempts = 0;

    client = new MongoClient(config.mongoUrl, {
      maxPoolSize: 20,
      minPoolSize: 1
    });

    while (!connected && attempts < 20) {
      attempts += 1;
      try {
        await client.connect();
        connected = true;
      } catch (e) {
        console.log('mongo connect attempt failed', attempts, e);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!connected) {
      throw new Error('mongo bootstrap connection failed');
    }

    db = client.db();
    console.log('Mongo connected', config.mongoUrl);
  }
  return db!;
}

export async function getDb() {
  if (!db) {
    await connectMongo();
  }
  return db!;
}

export async function closeMongo() {
  if (client) {
    await client.close();
  }
}

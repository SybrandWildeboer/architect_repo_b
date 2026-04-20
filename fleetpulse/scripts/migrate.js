const { MongoClient } = require('mongodb');

async function migrate() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/fleetpulse';
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();

  console.log('Running startup migration in app process');

  try {
    await db.collection('vehicles').createIndex({ tenantId: 1 });
  } catch (e) {
    console.log('index error', e);
  }

  try {
    await db.collection('vehicles').createIndex({ status: 1, updatedAt: -1 });
  } catch (e) {
    console.log('index error 2', e);
  }

  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  } catch (e) {
    console.log('index error 3', e);
  }

  await client.close();
  console.log('Migration done');
}

migrate().catch((e) => {
  console.log('migration fatal', e);
});

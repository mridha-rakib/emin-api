const fs = require('fs');
const mongoose = require('mongoose');

function readEnv() {
  return Object.fromEntries(
    fs
      .readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      }),
  );
}

async function main() {
  const env = readEnv();
  if (!env.MONGODB_URI) throw new Error('Missing MONGODB_URI');

  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME || 'emin' });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  console.log(`connectedDb=${db.databaseName}`);
  console.log(`collections=${collections.map((collection) => collection.name).join(',') || '(none)'}`);

  for (const name of ['users', 'categories', 'products']) {
    console.log(`${name}=${await db.collection(name).countDocuments()}`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

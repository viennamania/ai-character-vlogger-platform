import { Db, MongoClient } from "mongodb";

declare global {
  var aiVloggerMongoClientPromise: Promise<MongoClient> | undefined;
}

export function isAtlasConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!globalThis.aiVloggerMongoClientPromise) {
    globalThis.aiVloggerMongoClientPromise = new MongoClient(uri).connect();
  }

  return globalThis.aiVloggerMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "ai_character_vlogger");
}

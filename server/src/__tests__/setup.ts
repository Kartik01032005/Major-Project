import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

export default async function globalSetup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Share the URI with test files via environment variable
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test_jwt_secret_bloodlink_ci";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.NODE_ENV = "test";

  // Store mongod instance reference for teardown
  (globalThis as any).__MONGOD__ = mongod;
}

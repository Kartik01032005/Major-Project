import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedInitialData } from "./seed.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/bloodlink";

export const connectDB = async (): Promise<void> => {
  // Build candidate URIs (handling dual-stack localhost vs 127.0.0.1)
  const candidateUris = [MONGODB_URI];
  if (MONGODB_URI.includes("localhost")) {
    candidateUris.push(MONGODB_URI.replace("localhost", "127.0.0.1"));
  } else if (MONGODB_URI.includes("127.0.0.1")) {
    candidateUris.push(MONGODB_URI.replace("127.0.0.1", "localhost"));
  }

  let connected = false;

  for (const uri of candidateUris) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2500,
      });
      const hostPort = conn.connection.port
        ? `${conn.connection.host}:${conn.connection.port}`
        : conn.connection.host;
      console.log(`📡 MongoDB Connected: ${hostPort}`);
      await seedInitialData();
      connected = true;
      break;
    } catch {
      // Continue to next candidate or fallback
    }
  }

  if (connected) return;

  console.warn(`⚠️ Primary MongoDB connection at "${MONGODB_URI}" was unreachable.`);

  // Fallback: In development mode, start an in-memory Mongo server as a safety net
  if (process.env.NODE_ENV !== "production") {
    try {
      console.log("⚡ Starting local In-Memory MongoDB Server for development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      const hostPort = conn.connection.port
        ? `${conn.connection.host}:${conn.connection.port}`
        : conn.connection.host;
      console.log(`📡 In-Memory MongoDB Connected: ${hostPort}`);
      await seedInitialData();
      return;
    } catch (memError: any) {
      console.error("❌ Failed to initialize In-Memory MongoDB Server:", memError);
    }
  }

  console.log("⚠️ Working in offline database mode. Configure a valid MONGODB_URI in server/.env to run authenticated operations.");
};

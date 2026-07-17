import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/bloodlink";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error:`, error);
    console.log("⚠️ Working in offline database mode. Start MongoDB or configure MONGODB_URI in server/.env to run auth APIs.");
  }
};


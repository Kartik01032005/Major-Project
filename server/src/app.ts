import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "BloodLink API service is running" });
});

// API Routes
app.use("/api/auth", authRoutes);

// Page Not Found route
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Requested resource not found" });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Global Server Error:", err.stack || err);
  res.status(500).json({
    success: false,
    message: err.message || "An unexpected system error occurred"
  });
});

export default app;

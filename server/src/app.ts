import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";

import { generalLimiter, strictLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

// Security & Middlewares
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : 0);
const corsOptions = {
  origin: (process.env.CLIENT_URL || "http://localhost:3000").split(",").map((origin) => origin.trim()),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// Apply Rate Limiters
app.use("/api", generalLimiter);

// Health Check route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "BloodLink API service is running" });
});

// API Routes (Strict limiting on sensitive Auth & Emergency routes)
app.use("/api/auth", strictLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/emergency", strictLimiter, emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/hospitals", hospitalRoutes);


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

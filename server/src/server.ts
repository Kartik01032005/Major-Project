import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/socket.js";
import { startNotificationWorker } from "./services/notificationQueue.js";

const PORT = process.env.PORT ?? 5000;

const startServer = async () => {
  const server = http.createServer(app);
  initSocket(server);
  startNotificationWorker();

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server listening in development mode on port ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
  });

  // Connect to MongoDB Atlas or local/in-memory MongoDB instance
  await connectDB();
};

startServer().catch((err) => {
  console.error("❌ Failed to launch Express server:", err);
  process.exit(1);
});

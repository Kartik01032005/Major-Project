import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/socket.js";
import { startNotificationWorker } from "./services/notificationQueue.js";

import os from "os";

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

const PORT = process.env.PORT ?? 5000;

const startServer = async () => {
  const server = http.createServer(app);

  initSocket(server);
  startNotificationWorker();

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server listening in development mode on port ${PORT} (HTTP)`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`📱 http://${getLocalIp()}:${PORT}`);
  });

  // Connect to MongoDB Atlas or local/in-memory MongoDB instance
  await connectDB();

  // Start emergency blood request automatic expiration worker
  const { startExpiryWorker } = await import("./controllers/emergencyController.js");
  startExpiryWorker();

  // Verify Email Transporter configuration
  const { verifyTransporter } = await import("./services/emailService.js");
  await verifyTransporter();
};


// Server initialization
startServer().catch((err) => {
  console.error("❌ Failed to launch Express server:", err);
  process.exit(1);
});


import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/socket.js";

const PORT = process.env.PORT ?? 5000;

const startServer = async () => {
  // Connect to MongoDB Atlas or local MongoDB instance
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Server listening in development mode on port ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to launch Express server:", err);
  process.exit(1);
});


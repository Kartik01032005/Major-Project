import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;
const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: HttpServer): SocketIOServer => {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim());
  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Register active user connection mapping
    socket.on("register_user", (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.join(userId);
      console.log(`👤 User registered to socket room: ${userId}`);
    });

    socket.on("disconnect", () => {
      // Find and remove mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`👤 User unregistered from socket: ${userId}`);
          break;
        }
      }
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
};

// Helper to emit events to specific user
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

// Helper to broadcast to all clients
export const broadcast = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  }
};

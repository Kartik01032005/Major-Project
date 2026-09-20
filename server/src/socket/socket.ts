import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;
const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: HttpServer): SocketIOServer => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.62.127.58:3000",
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((s) => s.trim()) : [])
  ];

  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"), false);
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
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

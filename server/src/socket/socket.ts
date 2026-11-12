import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;
const userSockets = new Map<string, Set<string>>(); // userId -> Set of active socketIds across tabs

export const initSocket = (server: HttpServer): SocketIOServer => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.62.127.58:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://10.62.127.58:3000",
    "https://localhost",
    "capacitor://localhost",
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

    const registerSocketUser = (userId: string) => {
      if (!userId || typeof userId !== "string") return;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      socket.join(userId);
      console.log(`👤 User registered to socket room: ${userId} (active connections: ${userSockets.get(userId)!.size})`);
    };

    // Auto-register if userId provided in handshake auth (e.g. from tab session)
    if (socket.handshake.auth?.userId) {
      registerSocketUser(socket.handshake.auth.userId);
    }

    // Explicit registration event from client
    socket.on("register_user", (userId: string) => {
      registerSocketUser(userId);
    });

    socket.on("disconnect", () => {
      // Find and remove this socket from the user's active sockets set
      for (const [userId, sockets] of userSockets.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          console.log(`👤 User socket disconnected: ${userId} (remaining connections: ${sockets.size})`);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            console.log(`👤 All sockets disconnected for user: ${userId}`);
          }
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

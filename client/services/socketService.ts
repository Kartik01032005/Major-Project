import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";

function getSocketUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    const hostname = window.location.hostname;
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (
      envUrl &&
      !envUrl.includes("localhost") &&
      !envUrl.includes("127.0.0.1") &&
      !/^(?:\d{1,3}\.){3}\d{1,3}/.test(new URL(envUrl).hostname)
    ) {
      return envUrl.replace(/\/api\/?$/, "");
    }
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
    return `${window.location.protocol}//${hostname}:5000`;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
  return envUrl.replace(/\/api\/?$/, "");
}

let socket: Socket | null = null;
let registeredUserId: string | null = null;

export const socketService = {
  connect: (userId?: string): Socket => {
    if (userId) {
      registeredUserId = userId;
    }

    if (!socket) {
      const socketUrl = getSocketUrl();
      socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 10000,
        timeout: 8000,
        auth: {
          token: getAuthToken(),
          userId: registeredUserId,
        },
      });

      socket.on("connect", () => {
        console.log("🔌 Socket.IO connected:", socket?.id);
        if (registeredUserId) {
          socket?.emit("register_user", registeredUserId);
        }
      });

      socket.on("connect_error", () => {
        // Graceful handling when backend server is offline; prevent console spam
      });

      socket.on("disconnect", () => {
        console.log("🔌 Socket.IO disconnected");
      });

    } else if (registeredUserId && socket.connected) {
      socket.emit("register_user", registeredUserId);
    }
    return socket;
  },

  registerUser: (userId: string) => {
    registeredUserId = userId;
    if (socket?.connected) {
      socket.emit("register_user", userId);
    }
  },

  disconnect: () => {
    registeredUserId = null;
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on: (event: string, callback: (...args: unknown[]) => void) => {
    if (!socket) {
      socketService.connect();
    }
    socket?.on(event, callback);
  },

  off: (event: string, callback?: (...args: unknown[]) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  },

  getSocket: (): Socket | null => socket,
};

export default socketService;

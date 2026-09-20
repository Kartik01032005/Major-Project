import { io, Socket } from "socket.io-client";

function getSocketUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (
    envUrl &&
    !envUrl.includes("localhost") &&
    !envUrl.includes("127.0.0.1")
  ) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return (envUrl ?? "http://localhost:5000/api").replace(/\/api\/?$/, "");
}

let socket: Socket | null = null;

export const socketService = {
  connect: (userId?: string): Socket => {
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
      });

      socket.on("connect", () => {
        console.log("🔌 Socket.IO connected:", socket?.id);
        if (userId) {
          socket?.emit("register_user", userId);
        }
      });

      socket.on("connect_error", () => {
        // Graceful handling when backend server is offline; prevent console spam
      });

      socket.on("disconnect", () => {
        console.log("🔌 Socket.IO disconnected");
      });
    } else if (userId && socket.connected) {
      socket.emit("register_user", userId);
    }
    return socket;
  },

  disconnect: () => {
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

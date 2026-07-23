import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export const socketService = {
  connect: (userId?: string): Socket => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
      });

      socket.on("connect", () => {
        console.log("🔌 Socket.IO connected:", socket?.id);
        if (userId) {
          socket?.emit("register_user", userId);
        }
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

  on: (event: string, callback: (...args: any[]) => void) => {
    if (!socket) {
      socketService.connect();
    }
    socket?.on(event, callback);
  },

  off: (event: string, callback?: (...args: any[]) => void) => {
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

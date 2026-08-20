import { io, type Socket } from "socket.io-client";

import { env } from "../config/env";

/**
 * Derives the Socket.IO host from the REST API URL by stripping the `/api`
 * segment — the backend serves Socket.IO on the same HTTP host/port. Mirrors
 * the web client's socketService derivation so both apps hit the same server.
 */
const socketUrl = env.apiUrl.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

type EventCallback<T = unknown> = (payload: T) => void;

/**
 * Connects to the existing BloodLink Socket.IO server and registers the user in
 * their personal room (via the backend's `register_user` event) so the server
 * can route notifications to them with `emitToUser`. Reuses the web's
 * unauthenticated-then-self-register pattern — no server changes.
 */
export const socketService = {
  connect(userId: string): Socket {
    if (socket && socket.connected) {
      socket.emit("register_user", userId);
      return socket;
    }
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
    });
    socket.on("connect", () => {
      socket?.emit("register_user", userId);
    });
    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!socket) return;
    socket.on(event, (payload: unknown) => {
      callback(payload as T);
    });
  },

  off(event: string): void {
    socket?.off(event);
  },

  isConnected(): boolean {
    return Boolean(socket?.connected);
  },
};

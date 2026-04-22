import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000");
  }
  return socket;
};

export const disconnectRealtime = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

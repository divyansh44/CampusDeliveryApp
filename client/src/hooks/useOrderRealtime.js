import { useEffect } from "react";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

export function useOrderRealtime(callback) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    
    socket.emit("subscribe", { userId: user.id || user._id, role: user.role });

    const handleUpdate = () => {
      callback();
    };

    socket.on("order:update", handleUpdate);

    return () => {
      socket.off("order:update", handleUpdate);
    };
  }, [user, callback]);
}

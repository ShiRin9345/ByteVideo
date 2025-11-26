import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type UseSocketConnectionReturn = {
  isConnected: boolean;
  socketRef: ReturnType<typeof useRef<Socket | null>>;
};

export function useSocketConnection(
  onReceive: (data: any) => void,
): UseSocketConnectionReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 1. 建立连接（只执行一次）
  useEffect(() => {
    if (socketRef.current?.connected) return;

    const serverUrl = "http://localhost:3001";
    const socket = io(serverUrl, { path: "/socket.io/" });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleReceive = (data: any) => {
      onReceive(data);
    };

    socket.on("receiveDanmaku", handleReceive);

    return () => {
      socket.off("receiveDanmaku", handleReceive);
    };
  }, [onReceive]);

  return { isConnected, socketRef };
}

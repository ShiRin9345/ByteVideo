import { useCallback } from "react";
import { useDanmakuEngine } from "./useDanmakuEngine";
import { useDanmakuData } from "./useDanmakuData";
import { useSocketConnection } from "./useSocketConnection";
import { COLOR_POOL, type SeedDanmaku } from "../lib/danmakuSeed";

interface UseDanmakuOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  videoReady: boolean;
}

interface UseDanmakuReturn {
  toggle: () => void;
  isEnabled: boolean;
  isConnected: boolean;
  send: (text: string) => void;
}

export function useDanmaku({
  videoRef,
  containerRef,
  videoReady,
}: UseDanmakuOptions): UseDanmakuReturn {
  // 1. 初始化弹幕引擎
  const {
    emit: emitDanmaku,
    toggle: toggleDanmaku,
    isEnabled: danmakuEnabled,
  } = useDanmakuEngine(videoRef, containerRef, videoReady);

  // 2. 定义弹幕处理函数
  // 处理单个弹幕（Socket 实时消息）
  const handleIncomingDanmaku = useCallback(
    (data: SeedDanmaku) => {
      emitDanmaku({
        text: data.text,
        mode: data.mode,
        time: data.time,
        style: data.style,
      });
    },
    [emitDanmaku],
  );

  // 处理批量弹幕（分片加载）
  const handleBatchDanmaku = useCallback(
    (list: SeedDanmaku[]) => {
      for (const item of list) {
        emitDanmaku(item);
      }
    },
    [emitDanmaku],
  );

  // 3. 初始化 Socket 连接（接收实时弹幕）
  const { isConnected, socketRef } = useSocketConnection(handleIncomingDanmaku);

  // 4. 加载弹幕数据（分片加载历史弹幕）
  useDanmakuData(videoRef, handleBatchDanmaku, danmakuEnabled);

  // 5. 发送弹幕
  const handleSend = useCallback(
    (text: string) => {
      if (!videoRef.current) return;
      const payload: SeedDanmaku = {
        text,
        time: videoRef.current.currentTime,
        mode: "rtl",
        style: {
          fontSize: "32px",
          color: COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)],
          textShadow: "0 0 6px rgba(0,0,0,0.65)",
          fontWeight: "bold",
        },
      };

      // 乐观更新：自己发的立刻上屏
      emitDanmaku(payload);
      // 发送到服务器
      socketRef.current?.emit("sendDanmaku", payload);
    },
    [emitDanmaku, socketRef, videoRef],
  );

  return {
    toggle: toggleDanmaku,
    isEnabled: danmakuEnabled,
    isConnected,
    send: handleSend,
  };
}

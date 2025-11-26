import { useEffect, useRef, useCallback } from "react";
import {
  fetchDanmakuChunk,
  VIDEO_DURATION_SECONDS,
  type SeedDanmaku,
} from "@/features/danmaku/lib/danmakuSeed";

export function useDanmakuData(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  emitToScreen: (chunk: SeedDanmaku[]) => void,
  isEnabled: boolean,
) {
  const loadedMinutesRef = useRef<Set<number>>(new Set());
  const pendingMinutesRef = useRef<Set<number>>(new Set());
  const chunkCacheRef = useRef<Map<number, SeedDanmaku[]>>(new Map());

  const loadMinute = useCallback(
    async (minute: number) => {
      const totalMinutes = Math.ceil(VIDEO_DURATION_SECONDS / 60);
      if (minute < 0 || minute >= totalMinutes) return;
      if (
        loadedMinutesRef.current.has(minute) ||
        pendingMinutesRef.current.has(minute)
      )
        return;

      pendingMinutesRef.current.add(minute);
      try {
        const chunk = await fetchDanmakuChunk(minute);
        if (chunk.length > 0) {
          loadedMinutesRef.current.add(minute);
          chunkCacheRef.current.set(minute, chunk);
          if (isEnabled) emitToScreen(chunk);
        }
      } finally {
        pendingMinutesRef.current.delete(minute);
      }
    },
    [emitToScreen, isEnabled],
  );

  // 监听视频时间变化
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 初始加载
    loadMinute(0);
    loadMinute(1);

    const handleTimeUpdate = () => {
      const currentMinute = Math.floor(video.currentTime / 60);
      loadMinute(currentMinute);
      loadMinute(currentMinute + 1);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeked", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeked", handleTimeUpdate);
    };
  }, [loadMinute, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (isEnabled && chunkCacheRef.current.size > 0 && video) {
      const currentTime = video.currentTime;
      const upcomingItems = Array.from(chunkCacheRef.current.values()).flatMap(
        (chunk) => chunk.filter((item) => item.time >= currentTime),
      );
      if (upcomingItems.length > 0) {
        emitToScreen(upcomingItems);
      }
    }
  }, [isEnabled, emitToScreen, videoRef]);
}

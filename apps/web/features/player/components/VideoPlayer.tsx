"use client";

import { useEffect, useState, useRef, useId, useMemo } from "react";
import Aliplayer from "aliyun-aliplayer";
import "aliyun-aliplayer/build/skins/default/aliplayer-min.css";
import { useKeyboardControls } from "@/features/player/hooks/useKeyboardControls";
import { useDanmaku, DanmakuInput } from "@/features/danmaku";

interface VideoPlayerProps {
  videoId?: string;
  videoUrl?: string;
  playauth?: string;
  containerId?: string;
  width?: string | number;
  height?: string | number;
  autoplay?: boolean;
  license?: {
    key: string;
    domain: string;
  };
  className?: string;
  showDanmakuInput?: boolean;
}

export function VideoPlayer({
  videoId,
  videoUrl,
  playauth,
  containerId,
  width = "100%",
  height = "100%",
  autoplay = true,
  license = {
    key: "KPMVELt3K05RmqZk752588143e5cb4d4196b5d0c928f53632",
    domain: "bytecampvideo.top",
  },
  className = "",
  showDanmakuInput = true,
}: VideoPlayerProps) {
  const [videoReady, setVideoReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const aliplayerRef = useRef<Aliplayer | null>(null);
  // 使用 useId 生成稳定的 ID，避免 hydration 错误
  const playerId = useId();

  // 使用 useMemo 稳定 license 对象，避免每次渲染都创建新对象
  const stableLicense = useMemo(() => {
    return (
      license || {
        key: "KPMVELt3K05RmqZk752588143e5cb4d4196b5d0c928f53632",
        domain: "bytecampvideo.top",
      }
    );
  }, [license]);

  // 使用 useMemo 稳定 resolvedPlayerId
  const resolvedPlayerId = useMemo(
    () => containerId || `aliplayer-${playerId}`,
    [containerId, playerId],
  );

  // 初始化 Aliplayer 并获取内部的 video 元素
  useEffect(() => {
    // 如果没有 videoId 也没有 videoUrl，不初始化
    if (!videoId && !videoUrl) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      id: resolvedPlayerId,
      license: stableLicense,
      width,
      height,
      useH5Prism: true,
      autoplay,
      clickPause: true,
      skinLayout: [
        { name: "bigPlayButton", align: "cc" },
        { name: "H5Loading", align: "cc" },
        { name: "errorDisplay", align: "tlabs", x: 0, y: 0 },
        { name: "infoDisplay" },
        {
          name: "controlBar",
          align: "blabs",
          x: 0,
          y: 0,
          children: [
            { name: "progress", align: "blabs", x: 0, y: 44 },
            { name: "playButton", align: "tl", x: 15, y: 12 },
            { name: "timeDisplay", align: "tl", x: 10, y: 7 },
            { name: "fullScreenButton", align: "tr", x: 10, y: 12 },
            { name: "volume", align: "tr", x: 5, y: 10 },
          ],
        },
      ],
    };

    // 如果使用 VOD videoId
    if (videoId && playauth) {
      options.vid = videoId;
      options.playauth = playauth;
      options.encryptType = "1";
    }
    // 如果使用直接 URL
    else if (videoUrl) {
      options.source = videoUrl;
    }

    const aliplayer = new Aliplayer(options, (playerInstance) => {
      aliplayerRef.current = playerInstance;

      // 通过 DOM 查询获取 Aliplayer 内部的 video 元素和容器
      const container = document.getElementById(
        resolvedPlayerId,
      ) as HTMLDivElement | null;
      if (container) {
        containerRef.current = container;
        const videoElement = container.querySelector(
          "video",
        ) as HTMLVideoElement | null;
        if (videoElement) {
          videoRef.current = videoElement;
          setVideoReady(true);
        }
      }
    });

    return () => {
      setVideoReady(false);
      videoRef.current = null;
      containerRef.current = null;
      aliplayerRef.current = null;
      if (aliplayer) {
        try {
          aliplayer.dispose();
        } catch (error) {
          console.error("销毁播放器失败:", error);
        }
      }
    };
  }, [
    videoId,
    videoUrl,
    playauth,
    stableLicense,
    width,
    height,
    autoplay,
    resolvedPlayerId,
  ]);

  // 启用键盘控制 - 使用 aliplayerRef 和 videoRef
  useKeyboardControls({
    aliplayerRef,
    videoRef,
    seekStep: 10,
  });

  // 弹幕功能
  const {
    toggle: toggleDanmaku,
    isEnabled: danmakuEnabled,
    isConnected,
    send: handleSend,
  } = useDanmaku({
    videoRef,
    containerRef,
    videoReady,
  });

  return (
    <div className={`h-full w-full ${className}`}>
      <section
        className="relative h-full w-full overflow-hidden bg-black"
        aria-label="视频播放器"
      >
        {/* Aliplayer 容器 */}
        <div id={resolvedPlayerId} className="h-full w-full"></div>

        {/* 弹幕控制层 - 简化版，只显示弹幕开关 */}
        <div className="absolute right-4 bottom-4 z-10">
          <button
            type="button"
            onClick={toggleDanmaku}
            aria-label={danmakuEnabled ? "关闭弹幕" : "开启弹幕"}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-none p-2 text-white ${
              danmakuEnabled ? "bg-black/55" : "bg-black/25"
            }`}
          >
            <span
              className={`text-xs font-bold select-none ${
                danmakuEnabled ? "opacity-100" : "opacity-50"
              }`}
            >
              弹
            </span>
          </button>
        </div>
      </section>

      {showDanmakuInput && (
        <DanmakuInput isConnected={isConnected} onSend={handleSend} />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Aliplayer from "aliyun-aliplayer";
import "aliyun-aliplayer/build/skins/default/aliplayer-min.css";
import { useKeyboardControls } from "@/features/player/hooks/useKeyboardControls";

interface VideoPlayerProps {
  videoId: string;
  playauth: string;
}

const DEFAULT_LICENSE = {
  key: "KPMVELt3K05RmqZk752588143e5cb4d4196b5d0c928f53632",
  domain: "bytecampvideo.top",
};
export function VideoPlayer({ videoId, playauth }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const aliplayerRef = useRef<Aliplayer | null>(null);

  useEffect(() => {
    if (!videoId || !playauth) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      id: "aliplayer",
      license: DEFAULT_LICENSE,
      width: "100%",
      height: "100%",
      useH5Prism: true,
      autoplay: true,
      clickPause: true,
      vid: videoId,
      playauth: playauth,
      encryptType: "1",
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

    const aliplayer = new Aliplayer(options, (playerInstance) => {
      aliplayerRef.current = playerInstance;

      // 直接从 ref 获取容器和 video 元素
      if (containerRef.current) {
        const videoElement = containerRef.current.querySelector(
          "video",
        ) as HTMLVideoElement | null;
        if (videoElement) {
          videoRef.current = videoElement;
        }
      }
    });

    return () => {
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
  }, [videoId, playauth]);

  // 启用键盘控制 - 使用 aliplayerRef 和 videoRef
  useKeyboardControls({
    aliplayerRef,
    videoRef,
    seekStep: 10,
  });

  return (
    <div className="h-full w-full">
      <section
        className="relative h-full w-full overflow-hidden bg-black"
        aria-label="视频播放器"
      >
        {/* Aliplayer 容器 */}
        <div ref={containerRef} id="aliplayer" className="h-full w-full"></div>
      </section>
    </div>
  );
}

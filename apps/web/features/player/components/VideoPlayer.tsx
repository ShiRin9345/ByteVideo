"use client";

import { useEffect, useRef } from "react";
import Aliplayer from "aliyun-aliplayer";
import "aliyun-aliplayer/build/skins/default/aliplayer-min.css";

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
      autoplay: true,
      clickPause: true,
      source: playauth,
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

  return (
    <div
      ref={containerRef}
      id="aliplayer"
      className="h-full w-full bg-black"
    ></div>
  );
}

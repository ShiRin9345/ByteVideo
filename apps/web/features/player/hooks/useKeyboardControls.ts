"use client";

import { useEffect, useRef, RefObject } from "react";

interface UseKeyboardControlsOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aliplayerRef?: RefObject<any>;
  videoRef?: RefObject<HTMLVideoElement | null>;
  seekStep?: number;
}

export function useKeyboardControls({
  aliplayerRef,
  videoRef,
  seekStep = 10,
}: UseKeyboardControlsOptions) {
  const seekStepRef = useRef(seekStep);

  useEffect(() => {
    seekStepRef.current = seekStep;
  }, [seekStep]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const player = aliplayerRef?.current;
      const video = videoRef?.current;

      if (!player) return;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // 空格键：播放/暂停
      if (key === " ") {
        e.preventDefault();
        const status = player.getStatus();
        if (status === "playing") {
          player.pause();
        } else if (status === "pause" || status === "ready") {
          player.play();
        }
        return;
      }

      // 左右箭头：快进/后退
      if (key === "ArrowRight" || key === "ArrowLeft") {
        e.preventDefault();

        let currentTime: number;
        if (video) {
          currentTime = video.currentTime;
        } else {
          currentTime = player.getCurrentTime();
        }

        if (typeof currentTime !== "number" || isNaN(currentTime)) {
          return;
        }

        const direction = key === "ArrowRight" ? 1 : -1;
        const newTime = Math.max(
          0,
          currentTime + direction * seekStepRef.current,
        );
        if (video) {
          video.currentTime = newTime;
        }
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [aliplayerRef, videoRef]);
}

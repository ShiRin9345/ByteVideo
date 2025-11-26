import { useEffect, useRef, useState } from "react";
import Danmaku from "danmaku";

export function useDanmakuEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLElement | null>,
  videoReady?: boolean,
) {
  const danmakuRef = useRef<Danmaku | null>(null);
  const isInitializedRef = useRef(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // 初始化与销毁
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;

    if (!video || !container) {
      isInitializedRef.current = false;
      return;
    }

    // 保存容器的引用，用于清理函数
    const containerElement = container;

    const init = () => {
      try {
        // 安全地销毁旧的 Danmaku 实例
        if (danmakuRef.current) {
          try {
            // 检查容器是否仍然存在
            if (containerElement && containerElement.parentNode) {
              danmakuRef.current.destroy();
            }
          } catch (error) {
            // 忽略销毁时的错误
            console.warn("Error destroying previous Danmaku instance:", error);
          }
          danmakuRef.current = null;
        }

        danmakuRef.current = new Danmaku({
          container: containerElement,
          media: video,
          engine: "dom",
          comments: [],
        });
        danmakuRef.current.resize();
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize Danmaku:", error);
        isInitializedRef.current = false;
      }
    };

    if (video.readyState >= 2) {
      init();
    } else {
      isInitializedRef.current = false;
      video.addEventListener("loadeddata", init, { once: true });
    }

    const handleResize = () => danmakuRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (danmakuRef.current) {
        try {
          if (containerElement && containerElement.parentNode) {
            danmakuRef.current.destroy();
          } else {
            danmakuRef.current = null;
          }
        } catch (error) {
          console.warn("Error destroying Danmaku instance:", error);
          danmakuRef.current = null;
        }
      }
      isInitializedRef.current = false;
    };
  }, [videoRef, containerRef, videoReady]);

  // 暴露操作方法
  const emit = (item: {
    text: string;
    time: number;
    mode?: "ltr" | "rtl" | "top" | "bottom";
    style?: Partial<CSSStyleDeclaration>;
  }) => {
    if (isEnabled && isInitializedRef.current && danmakuRef.current) {
      danmakuRef.current.emit(item);
    }
  };

  const toggle = () => {
    const next = !isEnabled;
    if (next) {
      danmakuRef.current?.show();
    } else {
      danmakuRef.current?.hide();
      danmakuRef.current?.clear();
    }
    setIsEnabled(next);
  };

  return { danmakuRef, isEnabled, emit, toggle };
}

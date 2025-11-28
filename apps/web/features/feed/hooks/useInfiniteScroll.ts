import { useEffect } from "react";

interface UseInfiniteScrollOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
  isFetching: boolean; // 必须由外部传入当前是否正在请求
}

export function useInfiniteScroll({
  containerRef,
  onLoadMore,
  isFetching, // 接收外部状态
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];

      if (entry?.isIntersecting && !isFetching) {
        onLoadMore();
      }
    };

    // 查找静态触发器元素
    const trigger = container.querySelector(
      "#waterfall-load-more-trigger",
    ) as HTMLDivElement | null;

    if (!trigger) return;

    // 创建并启动 IntersectionObserver
    const observer = new IntersectionObserver(handleIntersection, {
      root: container,
      rootMargin: "0px",
      threshold: 0.1,
    });

    observer.observe(trigger);

    return () => {
      console.log("disconnect");
      observer.disconnect();
    };
  }, [containerRef, onLoadMore, isFetching]);
}

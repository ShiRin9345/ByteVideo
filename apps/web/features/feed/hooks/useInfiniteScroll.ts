import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore?: () => void;
  isFetching: boolean;
  // 增加一个 hasMore 状态，如果没有更多数据了，就不需要监听了
  hasMore?: boolean;
}

export function useInfiniteScroll({
  onLoadMore,
  isFetching,
  hasMore = true,
}: UseInfiniteScrollOptions) {
  // 1. 创建容器 ref，用于作为 IntersectionObserver 的 root
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 2. 创建一个专门给触发元素（底部的 Loading 条）用的 ref
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const container = containerRef.current;

    // 如果没有元素，或者正在加载，或者没数据了，直接不监听
    if (!trigger || !container || isFetching || !hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: container, // 使用容器作为 root
        threshold: 0.1,
      },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [isFetching, hasMore, onLoadMore]);

  return { containerRef, triggerRef };
}

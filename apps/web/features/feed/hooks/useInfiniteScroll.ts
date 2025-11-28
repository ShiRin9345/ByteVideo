import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore?: () => void;
  isFetching: boolean; // 必须由外部传入当前是否正在请求
}

export function useInfiniteScroll({
  containerRef,
  onLoadMore,
  isFetching, // 接收外部状态
}: UseInfiniteScrollOptions) {
  // 使用 ref 存储最新的回调函数和状态，避免依赖项变化导致 Observer 重建
  const onLoadMoreRef = useRef(onLoadMore);
  const isFetchingRef = useRef(isFetching);

  // 同步 ref 的值
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
    isFetchingRef.current = isFetching;
  }, [onLoadMore, isFetching]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMoreRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      // 使用 ref 获取最新值，避免闭包陷阱
      const currentIsFetching = isFetchingRef.current;
      const currentOnLoadMore = onLoadMoreRef.current;

      if (entry.isIntersecting && !currentIsFetching && currentOnLoadMore) {
        currentOnLoadMore();
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
      observer.disconnect();
    };
  }, [containerRef]);
}

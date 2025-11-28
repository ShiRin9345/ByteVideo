import { useState, useEffect, useRef, useCallback } from "react";
import type { CardPosition } from "@/features/feed/types";

interface UseVirtualScrollOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  itemCount: number;
  cardPositions: CardPosition[];
  onLoadMore?: () => void;
  threshold?: number; // 距离底部多少像素时触发加载，默认 200
  // 新增滚动状态回调
  onScrollingChange?: (scrolling: boolean) => void;
}

const lowerBound = (
  positions: CardPosition[],
  target: number,
  getValue: (pos: CardPosition) => number,
): number => {
  const n = positions.length;
  if (n === 0) return 0;

  let left = 0;
  let right = n - 1; // 闭区间 [left, right]

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const pos = positions[mid];
    if (!pos) {
      left = mid + 1;
      continue;
    }

    const value = getValue(pos);
    if (value >= target) {
      right = mid - 1; // 范围缩小到 [left, mid-1]
    } else {
      left = mid + 1; // 范围缩小到 [mid+1, right]
    }
  }

  return left;
};

export function useVirtualScroll({
  containerRef,
  itemCount,
  cardPositions,
  onLoadMore,
  threshold = 50,
  onScrollingChange,
}: UseVirtualScrollOptions) {
  // 初始状态：如果没有位置信息，渲染所有项目；否则渲染前几个
  const getInitialRange = () => {
    if (cardPositions.length === 0) {
      return { start: 0, end: itemCount };
    }
    // 初始渲染前 10 个项目
    return { start: 0, end: Math.min(itemCount, 10) };
  };

  const [visibleRange, setVisibleRange] = useState(getInitialRange);
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  // 新增滚动状态管理
  const scrollTimerRef = useRef<number | null>(null);
  const SCROLL_END_DELAY = 150;

  // 更新可见范围（使用二分查找优化，O(log N)）
  const updateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container || cardPositions.length === 0) {
      // 如果没有位置信息，渲染所有项目
      setVisibleRange({ start: 0, end: itemCount });
      return;
    }

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const scrollBottom = scrollTop + containerHeight;

    // 使用卡片位置精确计算可见范围
    const buffer = 500; // 上下各多渲染 500px 的区域
    const viewportTop = scrollTop - buffer;
    const viewportBottom = scrollBottom + buffer;

    const rawStart = lowerBound(
      cardPositions,
      viewportTop,
      (pos) => pos.top + pos.height,
    );
    const start = Math.max(0, rawStart - 1);

    const rawEnd =
      lowerBound(cardPositions, viewportBottom + 1, (pos) => pos.top) - 1;
    const end = Math.min(itemCount, rawEnd + 2);

    setVisibleRange({ start, end });
  }, [containerRef, itemCount, cardPositions]);

  // 统一的加载触发函数，确保原子性
  const triggerLoadMore = useCallback(() => {
    if (loadingRef.current || !onLoadMore) {
      return false;
    }

    loadingRef.current = true;
    onLoadMore();

    // 延迟重置 loading 状态
    // observer 保持连接，如果用户还在底部，会在 loadingRef 重置后自动触发
    setTimeout(() => {
      loadingRef.current = false;
    }, 1000); // 缩短延迟时间到 500ms，让响应更快

    return true;
  }, [onLoadMore]);

  // 处理滚动事件 - 只更新可见范围，不触发加载
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      // 处理滚动状态
      if (onScrollingChange) {
        onScrollingChange(true);
        if (scrollTimerRef.current !== null) {
          clearTimeout(scrollTimerRef.current);
        }
        scrollTimerRef.current = window.setTimeout(() => {
          onScrollingChange(false);
          scrollTimerRef.current = null;
        }, SCROLL_END_DELAY);
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 只更新可见范围，不触发加载
          updateVisibleRange();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // 初始计算
    updateVisibleRange();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [
    containerRef,
    updateVisibleRange,
    cardPositions.length,
    onScrollingChange,
  ]);

  // 触底加载更多 - 使用 IntersectionObserver（唯一触发源）
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || cardPositions.length === 0) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        triggerLoadMore();
      }
    };

    // 查找静态触发器元素
    const trigger = container.querySelector(
      "#waterfall-load-more-trigger",
    ) as HTMLDivElement | null;

    if (!trigger) return;

    // 更新触发器位置
    trigger.style.bottom = `${threshold}px`;
    triggerRef.current = trigger;

    // 创建并启动 IntersectionObserver
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: container,
      rootMargin: "0px",
      threshold: 0.1,
    });
    observerRef.current.observe(trigger);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      triggerRef.current = null;
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [
    containerRef,
    onLoadMore,
    threshold,
    cardPositions.length,
    triggerLoadMore,
  ]);

  return visibleRange;
}

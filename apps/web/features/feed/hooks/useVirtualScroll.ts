import { useState, useEffect, useRef, useCallback } from "react";
import type { CardPosition } from "@/features/feed/types";

interface UseVirtualScrollOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  itemCount: number;
  cardPositions: CardPosition[];
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

  // 处理滚动事件 - 只更新可见范围
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

  return visibleRange;
}

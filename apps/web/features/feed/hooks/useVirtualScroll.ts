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

export function useVirtualScroll({
  containerRef,
  itemCount,
  cardPositions,
  onLoadMore,
  threshold = 200,
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

  // 更新可见范围
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

    let start = 0;
    let end = itemCount;

    // 找到第一个可见的卡片
    for (let i = 0; i < cardPositions.length; i++) {
      const pos = cardPositions[i];
      if (!pos) continue;
      const cardBottom = pos.top + pos.height;
      if (cardBottom >= viewportTop) {
        start = Math.max(0, i - 1); // 多渲染一个以确保平滑
        break;
      }
    }

    // 找到最后一个可见的卡片
    for (let i = cardPositions.length - 1; i >= 0; i--) {
      const pos = cardPositions[i];
      if (!pos) continue;
      const cardBottom = pos.top + pos.height;
      if (cardBottom >= viewportTop && pos.top <= viewportBottom) {
        end = Math.min(itemCount, i + 1); // 确保不超过 itemCount
        break;
      }
    }

    // 确保 end 至少等于 start
    if (end < start) {
      end = Math.min(itemCount, start + 1);
    }

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
    }, 500); // 缩短延迟时间到 500ms，让响应更快

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

    // 创建底部触发器元素
    const trigger = document.createElement("div");
    trigger.id = "waterfall-load-more-trigger";
    trigger.style.height = "1px";
    trigger.style.position = "absolute";
    trigger.style.bottom = `${threshold}px`;
    trigger.style.width = "100%";
    trigger.style.pointerEvents = "none";
    triggerRef.current = trigger;

    // 找到内容容器并添加触发器
    const contentContainer = container.querySelector(
      "#waterfall-content-container",
    );
    if (contentContainer) {
      contentContainer.appendChild(trigger);

      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: container,
        rootMargin: "0px",
        threshold: 0.1,
      });
      observerRef.current.observe(trigger);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (trigger.parentNode) {
        trigger.parentNode.removeChild(trigger);
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

  // 当 cardPositions 变化时（新数据加载完成），检查是否仍在底部
  useEffect(() => {
    if (cardPositions.length === 0 || !onLoadMore) return;

    // 延迟检查，确保 DOM 已更新
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container || !triggerRef.current || loadingRef.current) return;

      // 检查 trigger 是否可见
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 如果 trigger 在容器视口内，说明还在底部
      const isVisible =
        triggerRect.top >= containerRect.top &&
        triggerRect.top <= containerRect.bottom &&
        triggerRect.bottom >= containerRect.top &&
        triggerRect.bottom <= containerRect.bottom;

      if (isVisible) {
        // 如果还在底部，触发加载
        triggerLoadMore();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [containerRef, cardPositions.length, onLoadMore, triggerLoadMore]);

  return visibleRange;
}

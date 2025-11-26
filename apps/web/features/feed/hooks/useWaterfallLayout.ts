import { useState, useEffect, useRef, useCallback } from "react";
import type { WaterfallItem, CardPosition } from "@/features/feed/types";

// 常量
const RESIZE_DEBOUNCE_DELAY = 100;
const SCROLL_END_DELAY = 150;

interface UseWaterfallLayoutOptions {
  items: WaterfallItem[];
  columns: number;
  columnGap: number;
  rowGap: number;
  containerWidth: number;
  onItemHeightChange?: (index: number, height: number) => void;
}
export function useWaterfallLayout({
  items,
  columns,
  columnGap,
  rowGap,
  containerWidth,
  onItemHeightChange,
}: UseWaterfallLayoutOptions) {
  const [cardPositions, setCardPositions] = useState<CardPosition[]>([]);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const resizeObserverRef = useRef<Map<number, ResizeObserver>>(new Map());
  const updateTimerRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Set<number>>(new Set());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // 计算列宽
  const columnWidth = (containerWidth - columnGap * (columns - 1)) / columns;

  // 初始化列高度数组
  useEffect(() => {
    if (columns > 0 && columnHeights.length !== columns) {
      setColumnHeights(new Array(columns).fill(0));
    }
  }, [columns, columnHeights.length]);

  // 计算卡片位置
  const calculatePositions = useCallback(() => {
    // 每次重新计算时，都从0开始
    const newColumnHeights = new Array(columns).fill(0);
    const newPositions: CardPosition[] = [];

    items.forEach((item, index) => {
      // 获取卡片高度（如果已测量则使用实际高度，否则使用估算高度）
      // 文字区域估算：line-clamp-3 需要更多空间，小屏幕下可能需要 70-80px
      // 用户信息区域（头像+用户名+点赞）：约 32px
      const textHeight = columnWidth < 200 ? 80 : 70;
      const userInfoHeight = 32; // 用户信息区域固定高度
      const itemHeight =
        itemHeightsRef.current.get(index) ||
        (columnWidth * item.height) / item.width + textHeight + userInfoHeight;

      // 找到最短的列
      let minHeight = newColumnHeights[0];
      let minIndex = 0;
      for (let i = 1; i < columns; i++) {
        if (newColumnHeights[i] < minHeight) {
          minHeight = newColumnHeights[i];
          minIndex = i;
        }
      }

      // 计算位置
      // 确保 rowGap 精确应用：第一行 top = 0，后续行 top = 列高度 + rowGap
      const left = minIndex * (columnWidth + columnGap);
      const top = minHeight + rowGap;

      newPositions.push({
        top,
        left,
        width: columnWidth,
        height: itemHeight,
        columnIndex: minIndex,
      });

      // 更新列高度：top + itemHeight 确保下一个卡片的位置精确
      newColumnHeights[minIndex] = top + itemHeight;
    });

    setCardPositions(newPositions);
    setColumnHeights(newColumnHeights);
  }, [items, columns, columnGap, rowGap, containerWidth, columnWidth]);

  // 增量更新布局（只更新受影响的位置）
  const updatePositionsIncremental = useCallback(
    (changedIndex: number) => {
      setCardPositions((prevPositions) => {
        if (prevPositions.length === 0) {
          calculatePositions();
          return prevPositions;
        }

        // 如果改变的索引超出了当前范围，重新计算全部
        if (changedIndex >= prevPositions.length) {
          calculatePositions();
          return prevPositions;
        }

        const changedPosition = prevPositions[changedIndex];
        if (!changedPosition) {
          return prevPositions;
        }

        const newHeight = itemHeightsRef.current.get(changedIndex);
        if (!newHeight) {
          return prevPositions;
        }

        const heightDiff = newHeight - changedPosition.height;
        // 如果高度变化很小（小于5px），忽略更新以避免不必要的布局偏移
        if (Math.abs(heightDiff) < 5) {
          return prevPositions;
        }

        // 重新计算从 changedIndex 开始的所有位置
        const newPositions = [...prevPositions];
        const newColumnHeights = new Array(columns).fill(0);

        // 先计算 changedIndex 之前的位置（保持不变）
        // 使用实际测量的高度，而不是 position.height，确保 gap 精确
        for (let i = 0; i < changedIndex; i++) {
          const pos = prevPositions[i];
          if (!pos) continue;
          // 优先使用实际测量的高度，如果没有则使用 position.height
          const actualHeight = itemHeightsRef.current.get(i) || pos.height;
          newColumnHeights[pos.columnIndex] = Math.max(
            newColumnHeights[pos.columnIndex],
            pos.top + actualHeight,
          );
        }

        // 重新计算从 changedIndex 开始的位置
        for (let i = changedIndex; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          // 使用与 calculatePositions 一致的文字高度估算
          const textHeight = item.text ? (columnWidth < 200 ? 80 : 70) : 0;
          const userInfoHeight = 32; // 用户信息区域固定高度
          const itemHeight =
            itemHeightsRef.current.get(i) ||
            (columnWidth * item.height) / item.width +
              textHeight +
              userInfoHeight;

          // 找到最短的列
          let minHeight = newColumnHeights[0];
          let minIndex = 0;
          for (let j = 1; j < columns; j++) {
            if (newColumnHeights[j] < minHeight) {
              minHeight = newColumnHeights[j];
              minIndex = j;
            }
          }

          const left = minIndex * (columnWidth + columnGap);
          // 确保 rowGap 精确应用：第一行 top = 0，后续行 top = 列高度 + rowGap
          const top = minHeight > 0 ? minHeight + rowGap : 0;

          newPositions[i] = {
            top,
            left,
            width: columnWidth,
            height: itemHeight,
            columnIndex: minIndex,
          };

          // 更新列高度：top + itemHeight 确保下一个卡片的位置精确
          newColumnHeights[minIndex] = top + itemHeight;
        }

        // 更新列高度
        setColumnHeights(newColumnHeights);
        return newPositions;
      });
    },
    [items, columns, columnGap, rowGap, columnWidth, calculatePositions],
  );

  // Resize debounce 定时器
  const resizeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isResizingRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const prevContainerWidthRef = useRef(containerWidth);
  const prevColumnsRef = useRef(columns);

  // 清理 resize 定时器
  const clearResizeTimer = useCallback(() => {
    if (resizeDebounceTimerRef.current) {
      clearTimeout(resizeDebounceTimerRef.current);
      resizeDebounceTimerRef.current = null;
    }
  }, []);

  // 处理resize的逻辑（debounce延迟执行）
  const handleResize = useCallback(() => {
    isResizingRef.current = true;
    clearResizeTimer();

    // 延迟执行布局更新（如果resize停止）
    resizeDebounceTimerRef.current = setTimeout(() => {
      isResizingRef.current = false;
      calculatePositions();
      resizeDebounceTimerRef.current = null;
    }, RESIZE_DEBOUNCE_DELAY);
  }, [calculatePositions, clearResizeTimer]);

  // 统一处理布局更新：监听 containerWidth、columns 和 items 的变化
  useEffect(() => {
    const containerWidthChanged =
      prevContainerWidthRef.current !== containerWidth;
    const columnsChanged = prevColumnsRef.current !== columns;

    // 首次加载时，立即更新布局
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (items.length > 0) {
        calculatePositions();
      }
      prevContainerWidthRef.current = containerWidth;
      prevColumnsRef.current = columns;
      return;
    }

    // 如果容器宽度或列数变化，触发resize debounce
    if (containerWidthChanged || columnsChanged) {
      handleResize();
    } else if (items.length > 0 && !isResizingRef.current) {
      // items变化且不在resize时，立即更新布局
      calculatePositions();
    }

    prevContainerWidthRef.current = containerWidth;
    prevColumnsRef.current = columns;
  }, [containerWidth, columns, items.length, handleResize, calculatePositions]);

  // 批量处理高度变化（防抖）
  const flushPendingUpdates = useCallback(() => {
    // 如果正在滚动，延迟更新
    if (isScrollingRef.current) {
      // 清除之前的定时器
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      // 滚动停止后延迟更新
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (!isScrollingRef.current && pendingUpdatesRef.current.size > 0) {
          flushPendingUpdates();
        }
      }, SCROLL_END_DELAY);
      return;
    }

    if (pendingUpdatesRef.current.size === 0) return;

    const updates = Array.from(pendingUpdatesRef.current);
    pendingUpdatesRef.current.clear();

    // 如果有多个更新，重新计算全部；如果只有一个，使用增量更新
    if (updates.length === 1 && updates[0] !== undefined) {
      updatePositionsIncremental(updates[0]);
    } else {
      calculatePositions();
    }
  }, [updatePositionsIncremental, calculatePositions]);

  // 处理单个卡片高度变化
  const handleItemHeightChange = useCallback(
    (index: number, height: number) => {
      const currentHeight = itemHeightsRef.current.get(index);

      // 如果高度变化很小（小于5px），忽略更新以避免不必要的布局偏移
      if (currentHeight !== undefined && Math.abs(currentHeight - height) < 5) {
        return;
      }

      // 如果高度变化超过50%，可能是测量错误，暂时忽略
      if (
        currentHeight !== undefined &&
        currentHeight > 0 &&
        Math.abs(currentHeight - height) / currentHeight > 0.5
      ) {
        return;
      }

      itemHeightsRef.current.set(index, height);
      onItemHeightChange?.(index, height);

      // 如果正在滚动，延迟更新
      if (isScrollingRef.current) {
        pendingUpdatesRef.current.add(index);
        return;
      }

      // 添加到待更新队列
      pendingUpdatesRef.current.add(index);

      // 清除之前的定时器
      if (updateTimerRef.current !== null) {
        window.cancelAnimationFrame(updateTimerRef.current);
      }

      // 使用 requestAnimationFrame 批量更新，减少布局偏移
      // 延迟到下一帧，确保不在滚动过程中更新
      updateTimerRef.current = window.requestAnimationFrame(() => {
        // 再延迟一帧，确保滚动事件处理完成
        updateTimerRef.current = window.requestAnimationFrame(() => {
          if (!isScrollingRef.current) {
            flushPendingUpdates();
          }
          updateTimerRef.current = null;
        });
      });
    },
    [onItemHeightChange, flushPendingUpdates],
  );

  // 监听卡片高度变化（使用 ResizeObserver）
  const observeItemHeight = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (!element) return;

      // 清理旧的 observer
      const oldObserver = resizeObserverRef.current.get(index);
      if (oldObserver) {
        oldObserver.disconnect();
      }

      // 先设置初始高度（基于估算值），避免首次测量时的布局偏移
      const item = items[index];
      if (item) {
        // 使用与 calculatePositions 一致的高度估算
        const textHeight = item.text ? (columnWidth < 200 ? 80 : 70) : 0;
        const userInfoHeight = 32; // 用户信息区域固定高度
        const estimatedHeight =
          (columnWidth * item.height) / item.width +
          textHeight +
          userInfoHeight;
        if (estimatedHeight > 0 && !itemHeightsRef.current.has(index)) {
          itemHeightsRef.current.set(index, estimatedHeight);
        }
      }

      const textHeight = item?.text ? (columnWidth < 200 ? 80 : 70) : 0;
      const userInfoHeight = 32; // 用户信息区域固定高度
      const estimatedHeight = item
        ? (columnWidth * item.height) / item.width + textHeight + userInfoHeight
        : 0;
      let lastReportedHeight =
        itemHeightsRef.current.get(index) || estimatedHeight;
      let rafId: number | null = null;
      let lastUpdateTime = 0;

      const observer = new ResizeObserver((entries) => {
        // 如果正在滚动，忽略更新
        if (isScrollingRef.current) {
          return;
        }

        for (const entry of entries) {
          const height = entry.contentRect.height;

          // 如果高度和上次报告的高度相同，忽略
          if (Math.abs(height - lastReportedHeight) < 1) {
            return;
          }

          // 节流：至少间隔 100ms 才更新一次
          const now = Date.now();
          if (now - lastUpdateTime < 100) {
            return;
          }

          lastReportedHeight = height;
          lastUpdateTime = now;

          // 使用 requestAnimationFrame 防抖
          if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
          }

          rafId = window.requestAnimationFrame(() => {
            if (!isScrollingRef.current) {
              handleItemHeightChange(index, height);
            }
            rafId = null;
          });
        }
      });
      observer.observe(element);
      resizeObserverRef.current.set(index, observer);
    },
    [handleItemHeightChange, items, columnWidth],
  );

  // 暴露滚动状态控制函数
  const setScrolling = useCallback(
    (scrolling: boolean) => {
      isScrollingRef.current = scrolling;
      if (!scrolling && pendingUpdatesRef.current.size > 0) {
        // 滚动停止后，延迟更新布局
        if (scrollTimeoutRef.current !== null) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = window.setTimeout(() => {
          flushPendingUpdates();
        }, SCROLL_END_DELAY);
      }
    },
    [flushPendingUpdates],
  );

  // 清理 observers 和定时器
  useEffect(() => {
    return () => {
      resizeObserverRef.current.forEach((observer) => {
        observer.disconnect();
      });
      resizeObserverRef.current.clear();
      if (updateTimerRef.current !== null) {
        window.cancelAnimationFrame(updateTimerRef.current);
      }
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      if (resizeDebounceTimerRef.current !== null) {
        clearTimeout(resizeDebounceTimerRef.current);
        resizeDebounceTimerRef.current = null;
      }
    };
  }, []);

  // 计算容器总高度
  const containerHeight =
    columnHeights.length > 0 ? Math.max(...columnHeights) : 0;

  return {
    cardPositions,
    columnHeights,
    columnWidth,
    containerHeight,
    observeItemHeight,
    setScrolling,
  };
}

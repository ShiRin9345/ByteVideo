import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { WaterfallItem, CardPosition } from "@/features/feed/types";

// 常量
const RESIZE_DEBOUNCE_DELAY = 100;

interface UseWaterfallLayoutOptions {
  items: WaterfallItem[];
  columns: number;
  columnGap: number;
  rowGap: number;
  containerWidth: number;
}
export function useWaterfallLayout({
  items,
  columns,
  columnGap,
  rowGap,
  containerWidth,
}: UseWaterfallLayoutOptions) {
  const [cardPositions, setCardPositions] = useState<CardPosition[]>([]);
  const [columnHeights, setColumnHeights] = useState<number[]>(
    new Array(columns).fill(0),
  );

  // 计算列宽
  const columnWidth = (containerWidth - columnGap * (columns - 1)) / columns;

  // 计算卡片高度估算
  const getEstimatedHeight = useCallback(
    (item: WaterfallItem | undefined): number => {
      // 如果没有 item，返回 0
      if (!item) {
        return 0;
      }

      // 计算估算高度
      // 文字区域估算：line-clamp-3 需要更多空间，小屏幕下可能需要 70-80px
      // 用户信息区域（头像+用户名+点赞）：约 32px
      const textHeight = item.text ? (columnWidth < 200 ? 80 : 70) : 0;
      const userInfoHeight = 32; // 用户信息区域固定高度
      const imageHeight = (columnWidth * item.height) / item.width;

      return imageHeight + textHeight + userInfoHeight;
    },
    [columnWidth],
  );

  // 计算卡片位置
  const calculatePositions = useCallback(() => {
    // 每次重新计算时，都从0开始
    const newColumnHeights = new Array(columns).fill(0);
    const newPositions: CardPosition[] = [];

    items.forEach((item) => {
      // 获取卡片高度（使用估算高度）
      const itemHeight = getEstimatedHeight(item);

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
  }, [items, columns, columnGap, rowGap, columnWidth, getEstimatedHeight]);

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

  // 清理 resize 定时器
  useEffect(() => {
    const resizeDebounceTimer = resizeDebounceTimerRef.current;
    return () => {
      if (resizeDebounceTimer !== null) {
        clearTimeout(resizeDebounceTimer);
      }
    };
  }, []);

  // 计算容器总高度
  const containerHeight = useMemo(
    () => (columnHeights.length > 0 ? Math.max(...columnHeights) : 0),
    [columnHeights],
  );

  return {
    cardPositions,
    columnHeights,
    columnWidth,
    containerHeight,
  };
}

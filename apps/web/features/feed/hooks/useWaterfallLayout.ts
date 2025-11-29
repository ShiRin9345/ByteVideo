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
  // 1. 状态管理
  const [cardPositions, setCardPositions] = useState<CardPosition[]>([]);
  // 这是一个用来渲染 UI 的高度状态
  const [containerHeight, setContainerHeight] = useState(0);

  // 2. 缓存层：记录"上一次计算完"的状态，用于增量计算
  // 使用 useRef 因为我们不想这些数据的变动触发重渲染，它们只是计算的中间态
  const cacheRef = useRef<{
    columnHeights: number[]; // 记录每一列当前的底部高度
    positions: CardPosition[]; // 记录所有已计算好的卡片位置
    processedCount: number; // 记录处理了多少个 item
  }>({
    columnHeights: [],
    positions: [],
    processedCount: 0,
  });

  // 辅助 ref：记录上一次的布局依赖，用于判断是否需要"全量重置"
  const layoutDepsRef = useRef({
    containerWidth,
    columns,
    columnGap,
    rowGap,
  });

  // 使用 ref 存储 items，避免 calculatePositions 依赖整个数组
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // 计算列宽
  const columnWidth = useMemo(
    () => (containerWidth - columnGap * (columns - 1)) / columns,
    [containerWidth, columnGap, columns],
  );

  // 计算卡片高度估算
  const getEstimatedHeight = useCallback(
    (item: WaterfallItem | undefined): number => {
      // 如果没有 item，返回 0
      if (!item) {
        return 0;
      }

      // 计算估算高度
      const textHeight = item.text ? (columnWidth < 200 ? 80 : 70) : 0;
      const userInfoHeight = 36; // 用户信息区域固定高度
      const imageHeight = (columnWidth * item.height) / item.width;

      return imageHeight + textHeight + userInfoHeight;
    },
    [columnWidth],
  );

  // 3. 核心计算逻辑
  const calculatePositions = useCallback(() => {
    // 通过 ref 获取最新的 items，避免依赖整个数组
    const currentItems = itemsRef.current;

    // 检查是否需要重置缓存 (当布局参数变化时)
    const isLayoutChanged =
      layoutDepsRef.current.containerWidth !== containerWidth ||
      layoutDepsRef.current.columns !== columns ||
      layoutDepsRef.current.columnGap !== columnGap ||
      layoutDepsRef.current.rowGap !== rowGap;

    // 检查是否是数据重置 (例如筛选后数据减少，或者完全变了)
    // 简单判断：如果当前 items 数量小于已处理的数量，说明列表被重置了
    const isDataReset = currentItems.length < cacheRef.current.processedCount;

    let startHeights: number[];
    let startPositions: CardPosition[];
    let startIndex: number;

    if (isLayoutChanged || isDataReset) {
      // === 全量计算模式 ===
      // 重置缓存
      startHeights = new Array(columns).fill(0);
      startPositions = [];
      startIndex = 0;

      // 更新布局依赖记录
      layoutDepsRef.current = { containerWidth, columns, columnGap, rowGap };
    } else {
      // === 增量计算模式 ===
      // 接着上一次的结果继续算
      startHeights = [...cacheRef.current.columnHeights];
      startPositions = [...cacheRef.current.positions];
      startIndex = cacheRef.current.processedCount;
    }

    // 如果没有新数据需要计算，直接返回（避免重复 set state）
    if (startIndex >= currentItems.length && !isLayoutChanged && !isDataReset) {
      return;
    }

    // 开始遍历 (从 startIndex 开始)
    for (let i = startIndex; i < currentItems.length; i++) {
      const item = currentItems[i];
      if (!item) continue;

      const itemHeight = getEstimatedHeight(item);

      // 找到目前高度最小的那一列
      if (startHeights.length === 0 || columns === 0) continue;

      let minHeight = startHeights[0] ?? 0;
      let minIndex = 0;

      for (let j = 1; j < columns; j++) {
        const currentHeight = startHeights[j] ?? 0;
        if (currentHeight < minHeight) {
          minHeight = currentHeight;
          minIndex = j;
        }
      }

      // 计算当前卡片位置
      const top = minHeight + (minHeight === 0 ? 0 : rowGap); // 第一行不需要 rowGap
      const left = minIndex * (columnWidth + columnGap);

      startPositions.push({
        top,
        left,
        width: columnWidth,
        height: itemHeight,
        columnIndex: minIndex,
      });

      // 更新该列高度
      startHeights[minIndex] = top + itemHeight;
    }

    // 更新缓存
    cacheRef.current = {
      columnHeights: startHeights,
      positions: startPositions,
      processedCount: currentItems.length,
    };

    // 更新 State 触发渲染
    setCardPositions(startPositions);
    setContainerHeight(Math.max(...startHeights, 0));
  }, [
    columns,
    columnGap,
    rowGap,
    columnWidth,
    containerWidth,
    getEstimatedHeight,
  ]);

  // Resize 处理逻辑 (防抖)
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  // 监听依赖变化
  useEffect(() => {
    // 首次加载时，立即更新布局
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (items.length > 0) {
        calculatePositions();
      }
      return;
    }

    // 如果是 Resize 导致的 containerWidth 变化，我们需要防抖

    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);

    // 如果只是 items 增加（增量更新），不需要防抖，为了用户体验应该立即计算
    const isIncremental =
      items.length > cacheRef.current.processedCount &&
      layoutDepsRef.current.containerWidth === containerWidth &&
      layoutDepsRef.current.columns === columns;

    if (isIncremental) {
      calculatePositions();
    } else {
      // 布局变化（如窗口大小改变），使用防抖避免频繁重绘
      resizeTimerRef.current = setTimeout(() => {
        calculatePositions();
      }, RESIZE_DEBOUNCE_DELAY);
    }

    return () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [
    items.length,
    containerWidth,
    columns,
    columnGap,
    rowGap,
    calculatePositions,
  ]);

  return {
    cardPositions,
    containerHeight,
    columnWidth,
  };
}

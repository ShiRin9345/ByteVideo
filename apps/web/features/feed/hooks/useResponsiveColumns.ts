import { useState, useEffect, useRef } from "react";

// 常量
const RESIZE_DEBOUNCE_DELAY = 100;

interface UseResponsiveColumnsOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  columnGap: number;
  minColumnWidth?: number; // 最小列宽，默认 200
  minColumns?: number; // 最小列数，默认 2
}

interface UseResponsiveColumnsReturn {
  columns: number;
  containerWidth: number;
  isResizing: boolean;
  isExpanding: boolean;
}

export function useResponsiveColumns({
  containerRef,
  columnGap,
  minColumnWidth = 200,
  minColumns = 2,
}: UseResponsiveColumnsOptions): UseResponsiveColumnsReturn {
  const [columns, setColumns] = useState(minColumns);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const prevWidthRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const newWidth = container.clientWidth;

      // 计算可以容纳多少列
      // 列数 = (容器宽度 + 列间距) / (最小列宽 + 列间距)
      const calculatedColumns = Math.max(
        minColumns,
        Math.floor((newWidth + columnGap) / (minColumnWidth + columnGap)),
      );

      // 首次加载时立即更新
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        setColumns(calculatedColumns);
        setContainerWidth(newWidth);
        prevWidthRef.current = newWidth;
        return;
      }

      // 判断是放大还是缩小
      setIsExpanding(newWidth > prevWidthRef.current);
      setIsResizing(true);

      // 防抖
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }

      resizeTimerRef.current = setTimeout(() => {
        setColumns(calculatedColumns);
        setContainerWidth(newWidth);
        setIsResizing(false);
        setIsExpanding(false);
        prevWidthRef.current = newWidth;
        resizeTimerRef.current = null;
      }, RESIZE_DEBOUNCE_DELAY);
    };

    // 初始计算
    updateSize();

    // 使用 ResizeObserver 监听容器大小变化
    resizeObserverRef.current = new ResizeObserver(updateSize);
    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }
    };
  }, [containerRef, columnGap, minColumnWidth, minColumns]);

  return { columns, containerWidth, isResizing, isExpanding };
}

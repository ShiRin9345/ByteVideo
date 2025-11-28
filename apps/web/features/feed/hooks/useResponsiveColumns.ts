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
  const prevIsExpandingRef = useRef(false);
  const prevIsResizingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = (entries?: ResizeObserverEntry[]) => {
      // 使用 ResizeObserver 的 entry 获取内容盒尺寸（更准确）
      // 如果没有 entry（如初始调用），则使用 clientWidth 作为后备
      const newWidth = entries?.[0]?.contentRect.width ?? container.clientWidth;

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
      const isExpanding = newWidth > prevWidthRef.current;
      const isResizing = true;

      // 只在值真正变化时才更新状态，避免不必要的重新渲染
      if (isExpanding !== prevIsExpandingRef.current) {
        setIsExpanding(isExpanding);
        prevIsExpandingRef.current = isExpanding;
      }

      if (isResizing !== prevIsResizingRef.current) {
        setIsResizing(isResizing);
        prevIsResizingRef.current = isResizing;
      }

      // 防抖
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }

      resizeTimerRef.current = setTimeout(() => {
        setColumns(calculatedColumns);
        setContainerWidth(newWidth);

        // 只在值变化时更新状态
        if (prevIsResizingRef.current) {
          setIsResizing(false);
          prevIsResizingRef.current = false;
        }
        if (prevIsExpandingRef.current) {
          setIsExpanding(false);
          prevIsExpandingRef.current = false;
        }

        prevWidthRef.current = newWidth;
        resizeTimerRef.current = null;
      }, RESIZE_DEBOUNCE_DELAY);
    };

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

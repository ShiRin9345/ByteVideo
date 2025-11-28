"use client";

import { useRef, useMemo } from "react";
import { WaterfallCardWrapper } from "./WaterfallCardWrapper";
import { LoadingIndicator } from "./LoadingIndicator";
import { useResponsiveColumns } from "@/features/feed/hooks/useResponsiveColumns";
import { useVirtualScroll } from "@/features/feed/hooks/useVirtualScroll";
import { useWaterfallLayout } from "@/features/feed/hooks/useWaterfallLayout";
import { useInfiniteScroll } from "@/features/feed/hooks/useInfiniteScroll";
import type { XiaohongshuWaterfallProps } from "@/features/feed/types";

export function XiaohongshuWaterfall({
  items,
  columnGap = 16,
  rowGap = 8,
  onLoadMore,
  loading = false,
  onItemClick,
}: XiaohongshuWaterfallProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 响应式列数计算和容器宽度管理
  const { columns, containerWidth, isResizing, isExpanding } =
    useResponsiveColumns({
      containerRef,
      columnGap,
    });

  // 瀑布流布局
  const { cardPositions, containerHeight, columnWidth } = useWaterfallLayout({
    items,
    columns,
    columnGap,
    rowGap,
    containerWidth,
  });

  // 计算内容区域的实际宽度（用于居中）
  const contentWidth = columns * columnWidth + (columns - 1) * columnGap;

  // 虚拟滚动
  const visibleRange = useVirtualScroll({
    containerRef,
    itemCount: items.length,
    cardPositions,
  });

  // 无限滚动（触底加载）
  useInfiniteScroll({
    containerRef,
    onLoadMore,
    isFetching: loading, // 传入外部管理的 loading 状态
  });

  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange.start, visibleRange.end],
  );
  const visiblePositions = useMemo(
    () => cardPositions.slice(visibleRange.start, visibleRange.end),
    [cardPositions, visibleRange.start, visibleRange.end],
  );

  return (
    <div
      ref={containerRef}
      className="waterfall-container relative overflow-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ height: "100%", maxWidth: "100%" }}
    >
      {/* 外层容器，用于实现放大时的水平居中 */}
      <div
        style={{
          display: isExpanding ? ("flex" as const) : ("block" as const),
          justifyContent: isExpanding
            ? ("center" as const)
            : ("flex-start" as const),
          width: "100%",
          height: `${containerHeight}px`,
          transition: isResizing ? "none" : "all 0.2s ease-out",
          overflowX: "hidden" as const,
        }}
      >
        {/* 容器，用于绝对定位 */}
        <div
          id="waterfall-content-container"
          className="relative"
          style={{
            width: `${Math.min(contentWidth, containerWidth)}px`,
            height: `${containerHeight}px`,
          }}
        >
          {/* 触底加载触发器（静态元素） */}
          <div
            id="waterfall-load-more-trigger"
            className="pointer-events-none absolute bottom-[50px] h-px w-full"
          />
          {/* 渲染可见的卡片 */}
          {visibleItems.map((item, index) => {
            const position = visiblePositions[index];
            if (!position) return null;

            return (
              <WaterfallCardWrapper
                key={item.id}
                item={item}
                position={position}
                onItemClick={onItemClick!}
              />
            );
          })}
        </div>
      </div>

      {loading && <LoadingIndicator />}
    </div>
  );
}

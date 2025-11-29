"use client";

import { useMemo } from "react";
import { cn } from "@workspace/ui/lib/utils";
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
  hasMore = true,
}: XiaohongshuWaterfallProps) {
  // 无限滚动（触底加载）- 返回 containerRef 和 triggerRef
  const { containerRef, triggerRef } = useInfiniteScroll({
    onLoadMore,
    isFetching: loading, // 传入外部管理的 loading 状态
    hasMore, // 是否还有更多数据
  });

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
      className="waterfall-container relative h-full max-w-full overflow-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* 外层容器，用于实现放大时的水平居中 */}
      <div
        className={cn(
          "waterfall-outer-container",
          isExpanding
            ? "waterfall-outer-container--expanding"
            : "waterfall-outer-container--not-expanding",
          isResizing
            ? "waterfall-outer-container--resizing"
            : "waterfall-outer-container--not-resizing",
        )}
        style={{
          height: `${containerHeight}px`,
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
            ref={triggerRef}
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
              />
            );
          })}
        </div>
      </div>

      {loading && <LoadingIndicator />}
    </div>
  );
}

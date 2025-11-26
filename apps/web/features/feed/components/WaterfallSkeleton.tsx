"use client";

import { useRef } from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useResponsiveColumns } from "@/features/feed/hooks/useResponsiveColumns";

interface WaterfallSkeletonProps {
  columnGap?: number;
  rowGap?: number;
  itemCount?: number;
}

export function WaterfallSkeleton({
  columnGap = 16,
  rowGap = 8,
  itemCount = 10,
}: WaterfallSkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 响应式列数计算和容器宽度管理
  const { columns, containerWidth } = useResponsiveColumns({
    containerRef,
    columnGap,
  });

  // 计算列宽
  const columnWidth =
    columns > 0 && containerWidth > 0
      ? (containerWidth - columnGap * (columns - 1)) / columns
      : 0;

  // 生成不同高度的骨架卡片数据（模拟瀑布流）
  const skeletonItems = Array.from({ length: itemCount }, (_, i) => {
    // 随机高度，模拟不同图片比例
    const baseHeight = 300;
    const heightVariation = 200;
    const height = baseHeight + (i % 3) * heightVariation;
    return {
      id: i,
      height,
    };
  });

  // 计算瀑布流布局
  const cardPositions = (() => {
    if (columns === 0 || columnWidth === 0) return [];

    const columnHeights = new Array(columns).fill(0);
    const positions: Array<{
      top: number;
      left: number;
      width: number;
      height: number;
    }> = [];

    skeletonItems.forEach((item) => {
      // 找到最短的列
      let minHeight = columnHeights[0];
      let minIndex = 0;
      for (let i = 1; i < columns; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          minIndex = i;
        }
      }

      // 计算位置
      const left = minIndex * (columnWidth + columnGap);
      const top = minHeight + (minHeight > 0 ? rowGap : 0);

      positions.push({
        top,
        left,
        width: columnWidth,
        height: item.height,
      });

      // 更新列高度
      columnHeights[minIndex] = top + item.height;
    });

    return positions;
  })();

  // 计算容器总高度
  const containerHeight =
    cardPositions.length > 0
      ? Math.max(...cardPositions.map((pos) => pos.top + pos.height))
      : 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-auto"
      style={{ height: "100%" }}
    >
      <div
        className="relative"
        style={{
          width: containerWidth > 0 ? `${containerWidth}px` : "100%",
          height: `${containerHeight}px`,
        }}
      >
        {cardPositions.map((position, index) => (
          <div
            key={index}
            className="bg-card absolute overflow-hidden rounded-lg shadow-sm"
            style={{
              left: `${position.left}px`,
              top: `${position.top}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
            }}
          >
            {/* 图片区域骨架 */}
            <Skeleton
              className="w-full rounded-none"
              style={{ height: `${position.height - 60}px` }}
            />

            {/* 文本区域骨架 */}
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

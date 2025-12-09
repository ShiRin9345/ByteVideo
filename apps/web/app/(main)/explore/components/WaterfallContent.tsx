"use client";

import { Button } from "@workspace/ui/components/button";
import { XiaohongshuWaterfall } from "@/features/feed/components/WaterfallList";
import { WaterfallSkeleton } from "@/features/feed/components/WaterfallSkeleton";
import type { WaterfallItem } from "@/features/feed/types";

interface WaterfallContentProps {
  items: WaterfallItem[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  searchQuery: string;
  selectedCategory: string;
  onClearFilters: () => void;
  sortBy: string;
  sortOrder: string;
}

export function WaterfallContent({
  items,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  searchQuery,
  selectedCategory,
  onClearFilters,
  sortBy,
  sortOrder,
}: WaterfallContentProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <WaterfallSkeleton columnGap={30} rowGap={50} itemCount={10} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg font-medium">
              加载失败，请刷新重试
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-lg font-medium">
              没有找到相关视频
            </p>
            {(searchQuery || selectedCategory !== "推荐") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={onClearFilters}
              >
                清除筛选条件
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-[calc(100vh-200px)] overflow-x-hidden">
        <XiaohongshuWaterfall
          key={`${selectedCategory}-${searchQuery}-${sortBy}-${sortOrder}`}
          items={items}
          columnGap={30}
          rowGap={50}
          onLoadMore={onLoadMore}
          loading={isFetchingNextPage}
          hasMore={hasNextPage}
        />
      </div>
    </div>
  );
}

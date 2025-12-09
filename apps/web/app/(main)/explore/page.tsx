"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { XiaohongshuWaterfall } from "@/features/feed/components/WaterfallList";
import { useVideoList } from "@/features/video";
import { WaterfallSkeleton } from "@/features/feed/components/WaterfallSkeleton";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { VideoItem } from "@/features/video";
import type { WaterfallItem } from "@/features/feed/types";

// 分类列表
const categories = [
  "推荐",
  "穿搭",
  "美食",
  "彩妆",
  "影视",
  "职场",
  "情感",
  "家居",
  "游戏",
  "旅行",
  "健身",
] as const;

type Category = (typeof categories)[number];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("推荐");
  const [sortBy, setSortBy] = useState<"createdAt" | "likes" | "views">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖处理搜索查询
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms 防抖延迟

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // 将分类映射到主题（如果分类不是"推荐"）
  const themeFilter =
    selectedCategory !== "推荐" ? selectedCategory : undefined;

  const {
    items: videoItems,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useVideoList({
    limit: 10,
    name: debouncedSearchQuery || undefined,
    theme: themeFilter,
    sortBy,
    sortOrder,
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 将 VideoItem 转换为 WaterfallItem 格式
  const waterfallItems = useMemo<WaterfallItem[]>(() => {
    return videoItems.map((video: VideoItem) => {
      // 使用封面图作为图片，如果没有则使用占位图
      const imageUrl = video.coverUrl;

      // 使用视频的封面图宽高，如果没有则使用默认值
      const defaultWidth = 400;
      const defaultHeight = 600;
      const width = video.coverWidth ?? defaultWidth;
      const height = video.coverHeight ?? defaultHeight;

      return {
        id: video.id,
        image: imageUrl,
        width,
        height,
        text: video.name,
        // 保留原始视频数据以便后续使用
        videoId: video.videoId,
        name: video.name,
        theme: video.theme,
        views: video.views,
        likes: video.likes,
        createdAt: video.createdAt,
        // 传递作者信息
        author: video.author,
      };
    });
  }, [videoItems]);

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      {/* 搜索和筛选栏 */}
      <div className="bg-background sticky top-0 z-40 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* 搜索框 */}
            <div className="relative max-w-md flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="搜索视频名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* 排序选择器 */}
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: "createdAt" | "likes" | "views") =>
                  setSortBy(value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">最新发布</SelectItem>
                  <SelectItem value="likes">点赞数</SelectItem>
                  <SelectItem value="views">播放量</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="排序方向" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 分类标签栏 */}
      <div className="bg-background sticky top-[4.5rem] z-30 overflow-x-hidden sm:top-[5rem]">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex w-full gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 瀑布流内容 */}
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        {isLoading && waterfallItems.length === 0 ? (
          <WaterfallSkeleton columnGap={30} rowGap={50} itemCount={10} />
        ) : isError ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-destructive text-lg font-medium">
                加载失败，请刷新重试
              </p>
            </div>
          </div>
        ) : waterfallItems.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-lg font-medium">
                没有找到相关视频
              </p>
              {(debouncedSearchQuery || selectedCategory !== "推荐") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("推荐");
                  }}
                >
                  清除筛选条件
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)] overflow-x-hidden">
            <XiaohongshuWaterfall
              key={`${selectedCategory}-${debouncedSearchQuery}-${sortBy}-${sortOrder}`}
              items={waterfallItems}
              columnGap={30}
              rowGap={50}
              onLoadMore={handleLoadMore}
              loading={isFetchingNextPage}
              hasMore={hasNextPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

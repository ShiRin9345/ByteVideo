"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useVideoList } from "@/features/video";
import type { VideoItem } from "@/features/video";
import type { WaterfallItem } from "@/features/feed/types";
import { SearchAndFilterBar } from "./components/SearchAndFilterBar";
import { CategoryTabs, type Category } from "./components/CategoryTabs";
import { WaterfallContent } from "./components/WaterfallContent";

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

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("推荐");
  }, []);

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <SearchAndFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <WaterfallContent
        items={waterfallItems}
        isLoading={isLoading}
        isError={isError}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={handleLoadMore}
        searchQuery={debouncedSearchQuery}
        selectedCategory={selectedCategory}
        onClearFilters={handleClearFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}

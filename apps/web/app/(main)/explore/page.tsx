"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { XiaohongshuWaterfall } from "@/features/feed/components/WaterfallList";
import { useWaterfallData } from "@/features/feed/hooks/useWaterfallData";
import { WaterfallSkeleton } from "@/features/feed/components/WaterfallSkeleton";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import type { WaterfallItem } from "@/features/feed/types";
import { useAuth } from "@/features/auth";
import { LoginDialog } from "@/components/login-dialog";

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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("推荐");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useWaterfallData({ pageSize: 10 });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCardClick = useCallback(
    (item: WaterfallItem) => {
      // 检查用户是否登录
      if (!isAuthenticated) {
        setLoginDialogOpen(true);
        return;
      }
      router.push(`/explore/${item.id}`);
    },
    [router, isAuthenticated],
  );

  // 过滤和排序数据
  const filteredAndSortedItems = items.filter((item) => {
    // 分类筛选
    if (selectedCategory !== "推荐") {
      const itemCategory = (item as { category?: string }).category;
      if (itemCategory !== selectedCategory) {
        return false;
      }
    }

    // 搜索筛选
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.text?.toLowerCase().includes(query) ||
      String(item.id).includes(query)
    );
  });

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
                placeholder="搜索视频主题、名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
        {isLoading && items.length === 0 ? (
          <WaterfallSkeleton columnGap={30} rowGap={50} itemCount={10} />
        ) : isError ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-destructive text-lg font-medium">
                加载失败，请刷新重试
              </p>
            </div>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-lg font-medium">
                没有找到相关视频
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  清除搜索条件
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)] overflow-x-hidden">
            <XiaohongshuWaterfall
              items={filteredAndSortedItems}
              columnGap={30}
              rowGap={50}
              onLoadMore={hasNextPage ? handleLoadMore : () => {}}
              loading={isFetchingNextPage}
              onItemClick={handleCardClick}
            />
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
}

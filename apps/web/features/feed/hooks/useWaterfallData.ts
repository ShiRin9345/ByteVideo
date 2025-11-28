import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { WaterfallItem } from "@/features/feed/types";
import { dynamicBlurDataUrl } from "@/features/feed/utils/dynamicBlurDataUrl";

interface UseWaterfallDataOptions {
  pageSize?: number;
  initialData?: WaterfallItem[];
}

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

// 模拟数据生成函数
function generateMockItems(count: number, startIndex = 0): WaterfallItem[] {
  const items: WaterfallItem[] = [];
  const texts = [
    "今天天气真好，适合出去走走～阳光明媚，微风习习，正是踏青的好时节，约上三五好友一起享受这美好的时光吧！",
    "分享一个超好用的生活小技巧！这个方法真的超级实用，我已经用了很久了，效果非常好，强烈推荐给大家试试看！",
    "最近发现了一家超棒的咖啡店☕环境优雅，咖啡香浓，服务也很贴心，是我最近最爱的下午茶去处，强烈推荐！",
    "周末去了一个很美的公园，推荐给大家🌸那里有美丽的湖泊、绿树成荫的小径，还有各种可爱的动物，非常适合放松心情！",
    "这个季节最适合做的事情就是...去户外感受大自然的美好，呼吸新鲜空气，享受阳光和微风，让身心都得到放松和愉悦！",
    "终于完成了这个项目，太开心了！经过这么长时间的努力，终于看到了成果，虽然过程很辛苦，但一切都是值得的！",
    "分享一些日常穿搭心得💃最近整理了一些搭配技巧，希望能给大家一些灵感，让每天的穿搭都充满新鲜感和时尚感！",
    "今天尝试了新的菜谱，味道不错😋这道菜做起来很简单，但味道却非常棒，家人朋友都夸赞，以后会经常做这道菜！",
  ];

  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    // 使用固定算法生成确定性的尺寸
    const widthSeed = (index * 7 + 12345) % 200;
    const heightSeed = (index * 11 + 54321) % 300;
    const width = 400 + widthSeed; // 400-600
    const height = 500 + heightSeed; // 500-800

    // 使用固定算法分配分类
    const categoryIndex = index % categories.length;
    const category = categories[categoryIndex]!;

    items.push({
      id: index,
      image: `https://picsum.photos/seed/${index}/${width}/${height}`,
      width,
      height,
      text: texts[index % texts.length]!,
      category, // 添加分类字段
    });
  }

  return items;
}

// 模拟 API 请求函数
async function fetchWaterfallItems({
  pageParam = 0,
  pageSize = 10,
}: {
  pageParam?: number;
  pageSize?: number;
}): Promise<{ items: WaterfallItem[]; nextCursor: number | null }> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const startIndex = pageParam;
  const items = generateMockItems(pageSize, startIndex);

  // 立即返回数据，不等待 blurDataURL 生成
  // blurDataURL 将在组件层面异步生成

  // 模拟最多加载 100 条数据
  const maxItems = 1000;
  const nextCursor =
    startIndex + pageSize < maxItems ? startIndex + pageSize : null;

  return {
    items, // 不包含 blurDataURL，将在 hook 中异步生成
    nextCursor,
  };
}

interface UseWaterfallDataReturn {
  items: WaterfallItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  isError: boolean;
  error: Error | null;
}

export function useWaterfallData({
  pageSize = 10,
  initialData,
}: UseWaterfallDataOptions = {}): UseWaterfallDataReturn {
  const query = useInfiniteQuery({
    queryKey: ["waterfall-items", pageSize],
    queryFn: ({ pageParam }) =>
      fetchWaterfallItems({ pageParam: pageParam as number, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchOnMount: true, // 确保在挂载时重新获取
    refetchOnWindowFocus: false, // 禁用窗口聚焦时重新获取
    initialData:
      initialData && initialData.length > 0
        ? {
            pages: [{ items: initialData, nextCursor: initialData.length }],
            pageParams: [0],
          }
        : undefined,
  });

  // 扁平化所有页面的数据
  const rawItems = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  // 使用 useQueries 异步生成 blurDataURL（不阻塞主数据加载）
  const blurQueries = useQueries({
    queries: rawItems.map((item) => ({
      queryKey: ["blur-data-url", item.image],
      queryFn: async () => {
        try {
          return await dynamicBlurDataUrl(item.image);
        } catch (error) {
          console.warn(
            `Failed to generate blurDataURL for ${item.image}:`,
            error,
          );
          return undefined;
        }
      },
      enabled: !!item.image && !item.blurDataURL, // 如果已有 blurDataURL 则跳过
      staleTime: Infinity, // blurDataURL 不会过期
      gcTime: 24 * 60 * 60 * 1000, // 24 小时缓存
    })),
  });

  // 合并 blurDataURL 到 items
  const items = useMemo(() => {
    return rawItems.map((item, index) => ({
      ...item,
      blurDataURL: item.blurDataURL || blurQueries[index]?.data,
    }));
  }, [rawItems, blurQueries]);
  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
  };
}

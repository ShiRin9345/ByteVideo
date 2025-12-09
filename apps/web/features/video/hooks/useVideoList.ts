import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchVideoList } from "../api/video-list";
import type { VideoItem, VideoListParams } from "../types";

interface UseVideoListOptions {
  limit?: number;
  name?: string;
  theme?: string;
  sortBy?: "views" | "likes" | "createdAt";
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
}

interface UseVideoListReturn {
  items: VideoItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * 使用无限查询获取视频列表
 * @param options 查询选项
 * @returns 视频列表数据和状态
 */
export function useVideoList(
  options: UseVideoListOptions = {},
): UseVideoListReturn {
  const {
    limit = 10,
    name,
    theme,
    sortBy = "createdAt",
    sortOrder = "desc",
    enabled = true,
  } = options;

  const query = useInfiniteQuery({
    queryKey: ["video-list", name, theme, sortBy, sortOrder, limit],
    queryFn: ({ pageParam }) =>
      fetchVideoList({
        cursor: pageParam as string | null,
        limit,
        name,
        theme,
        sortBy,
        sortOrder,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor,
    enabled,
    refetchOnWindowFocus: false,
  });

  // 扁平化所有页面的数据
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data.items) ?? [],
    [query.data?.pages],
  );

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

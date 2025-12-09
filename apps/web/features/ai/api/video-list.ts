// 视频数据接口
export interface VideoItem {
  id: string;
  name: string;
  theme: string[]; // 主题数组
  views: number;
  likes: number;
  publishTime: string;
}

// API 响应接口
export interface VideoListResponse {
  success: boolean;
  data: {
    items: VideoItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

import { apiClient } from "@/lib/axios";

// 获取视频列表（当前用户自己的视频）
export async function fetchVideoList(params: {
  page: number;
  pageSize: number;
  search: string | null;
  theme: string | null;
  sortBy: string | null;
  sortOrder: "asc" | "desc" | null;
}): Promise<VideoListResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  // 使用认证的 API 端点，获取当前用户自己的视频
  let url = `/video/my${queryString ? `?${queryString}` : ""}`;

  // 如果是服务器端，构建完整 URL
  if (typeof window === "undefined") {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000";
    url = `${baseUrl}/api${url}`;
  }

  const response = await apiClient.get<VideoListResponse>(url);
  return response.data;
}

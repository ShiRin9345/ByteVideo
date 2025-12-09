import { cookies } from "next/headers";
import type { VideoItem } from "@/features/ai/api/video-list";

export interface GetVideoListParams {
  page?: number;
  pageSize?: number;
  search?: string | null;
  theme?: string | null;
  sortBy?: string | null;
  sortOrder?: "asc" | "desc" | null;
}

export interface GetVideoListResult {
  items: VideoItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 在服务端获取当前用户的视频列表
 * 通过内部 API 调用获取数据
 */
export async function getVideoList(
  params: GetVideoListParams = {},
): Promise<GetVideoListResult | null> {
  try {
    // 从 cookies 获取 access token
    const cookieStore = await cookies();
    console.log(cookieStore);
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return null;
    }

    // 构建查询参数
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.search) searchParams.set("search", params.search);
    if (params.theme) searchParams.set("theme", params.theme);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000");

    // 调用内部 API
    const response = await fetch(`${baseUrl}/api/video/my?${queryString}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store", // 不缓存，确保获取最新数据
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Get video list error:", error);
    return null;
  }
}

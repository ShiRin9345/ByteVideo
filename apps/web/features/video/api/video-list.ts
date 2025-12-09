import { apiClient } from "@/lib/axios";
import type { VideoListResponse, VideoListParams } from "../types";

/**
 * 获取视频列表
 * @param params 查询参数
 * @returns 视频列表响应
 */
export async function fetchVideoList(
  params: VideoListParams,
): Promise<VideoListResponse> {
  const searchParams = new URLSearchParams();

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.name) {
    searchParams.set("name", params.name);
  }
  if (params.theme) {
    searchParams.set("theme", params.theme);
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const queryString = searchParams.toString();
  const url = `/video/list${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<VideoListResponse>(url);
  return response.data;
}

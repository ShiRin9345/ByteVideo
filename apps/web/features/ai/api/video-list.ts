// 视频数据接口
export interface VideoItem {
  id: string;
  name: string;
  theme: string;
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

// 获取视频列表
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
  const url = `/api/video/list?${queryString}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch video list: ${response.statusText}`);
  }
  return response.json();
}

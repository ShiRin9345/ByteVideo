export interface VideoItem {
  id: string;
  name: string;
  theme: string[]; // 主题数组
  description: string;
  tags: string[];
  videoId: string;
  coverUrl: string;
  coverWidth: number | null; // 封面图宽度
  coverHeight: number | null; // 封面图高度
  views: number;
  likes: number;
  comments: number;
  createdAt: string; // ISO 字符串格式
  updatedAt: string; // ISO 字符串格式
  author?: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}

export interface VideoListResponse {
  success: boolean;
  data: {
    items: VideoItem[];
    nextCursor: string | null;
  };
  error?: string;
}

export interface VideoListParams {
  cursor?: string | null;
  limit?: number;
  name?: string; // 名称模糊搜索
  theme?: string; // 主题筛选
  sortBy?: "views" | "likes" | "createdAt";
  sortOrder?: "asc" | "desc";
}

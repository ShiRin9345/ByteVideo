import { apiClient } from "@/lib/axios";

export interface VideoDetailData {
  id: string;
  name: string;
  theme: string[];
  description: string | null;
  tags: string[] | null;
  videoId: string;
  coverUrl: string | null;
  coverWidth: number | null; // 封面图宽度
  coverHeight: number | null; // 封面图高度
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}

export interface VideoDetailResponse {
  success: boolean;
  data?: VideoDetailData;
  error?: string;
}

/**
 * 获取视频详情
 * @param id 视频 ID（数据库中的 id）
 * @returns 视频详情
 */
export async function fetchVideoDetail(
  id: string,
): Promise<VideoDetailResponse> {
  const response = await apiClient.get<VideoDetailResponse>(`/video/${id}`);
  return response.data;
}

/**
 * 获取视频播放权限
 * @param videoId 阿里云 VOD 的 videoId
 * @returns 播放权限响应
 */
export async function fetchVideoPlayAuth(videoId: string) {
  const response = await apiClient.get("/video/upload/url", {
    params: { videoId },
  });
  return response.data;
}

export interface CommentItem {
  id: string;
  content: string;
  likes: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}

export interface CommentListResponse {
  success: boolean;
  data?: CommentItem[];
  error?: string;
}

/**
 * 获取视频评论列表
 * @param videoId 视频 ID（数据库中的 id）
 * @returns 评论列表
 */
export async function fetchVideoComments(
  videoId: string,
): Promise<CommentListResponse> {
  const response = await apiClient.get<CommentListResponse>(
    `/video/${videoId}/comments`,
  );
  return response.data;
}

export interface LikeVideoResponse {
  success: boolean;
  data?: {
    id: string;
    likes: number;
  };
  error?: string;
}

/**
 * 点赞视频
 * @param videoId 视频 ID（数据库中的 id）
 * @returns 点赞响应
 */
export async function likeVideo(videoId: string): Promise<LikeVideoResponse> {
  const response = await apiClient.post<LikeVideoResponse>(
    `/video/${videoId}/like`,
  );
  return response.data;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateCommentResponse {
  success: boolean;
  data?: {
    id: string;
    content: string;
    likes: number;
    createdAt: string;
    videoComments: number;
  };
  error?: string;
}

/**
 * 创建评论
 * @param videoId 视频 ID（数据库中的 id）
 * @param content 评论内容
 * @returns 创建评论响应
 */
export async function createComment(
  videoId: string,
  content: string,
): Promise<CreateCommentResponse> {
  const response = await apiClient.post<CreateCommentResponse>(
    `/video/${videoId}/comments`,
    { content },
  );
  return response.data;
}

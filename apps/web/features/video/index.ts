// Types
export type { VideoItem, VideoListResponse, VideoListParams } from "./types";

// API
export { fetchVideoList } from "./api/video-list";
export {
  getVideoList,
  type GetVideoListParams,
  type GetVideoListResult,
} from "./api/my-video-list";
export {
  fetchVideoDetail,
  fetchVideoPlayAuth,
  fetchVideoComments,
  likeVideo,
  createComment,
  type VideoDetailData,
  type VideoDetailResponse,
  type CommentItem,
  type CommentListResponse,
  type LikeVideoResponse,
  type CreateCommentResponse,
} from "./api/video-detail";

// Hooks
export { useVideoList } from "./hooks/useVideoList";

// Components
export { VideoInteractionBar } from "./components/VideoInteractionBar";

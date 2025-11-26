// Video API
export {
  createVideoTask,
  checkTaskStatus,
  pollTaskResult,
  generateVideoTags,
  RESOLUTION_OPTIONS,
} from "./api/videoTask";

// Mock data
export {
  generateAllVideosData,
  generateSingleVideoData,
  generateVideoList,
} from "./lib/mockData";

// Utils
export { extractTagsFromText } from "./utils/extractTagsFromText";

// Types
export type {
  DashScopeContentPart,
  VideoGenerateRequest,
  VideoGenerateResponse,
  TaskStatusResponse,
  GenerationResult,
  VideoTagRequest,
  VideoTagResponse,
  VideoDataPoint,
  VideoInfo,
} from "./types";

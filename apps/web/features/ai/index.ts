// Video API
export {
  createVideoTask,
  checkTaskStatus,
  pollTaskResult,
  generateVideoTags,
  RESOLUTION_OPTIONS,
} from "./api/videoTask";

// Mock data

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
} from "./types";

// Types
export type {
  OSSCredentials,
  OSSConfig,
  UploadFileType,
  UploadProgressCallback,
} from "./types";

// API
export { getSTSCredentials } from "./lib/sts";

// Lib
export { isCredentialsExpired } from "./utils/credentials";
export { uploadFileToOSS } from "./lib/upload";

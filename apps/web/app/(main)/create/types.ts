export interface VideoUploadState {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "paused" | "success" | "failed";
  videoId?: string; // VOD videoId
  error?: string;
  uploadIndex?: number; // 在上传器中的索引
}

export interface CoverUploadState {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "success" | "failed";
  url?: string;
  error?: string;
}

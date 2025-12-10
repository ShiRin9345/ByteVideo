export interface OSSCredentials {
  AccessKeyId: string;
  AccessKeySecret: string;
  SecurityToken: string;
  Expiration: string;
}

export interface OSSConfig {
  bucket: string;
  region: string;
}

export type UploadFileType = "video" | "cover" | "avatar";

export interface UploadProgressCallback {
  (progress: number): void;
}

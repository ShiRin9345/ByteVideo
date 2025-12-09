import { useState, useCallback } from "react";
import { CoverUploadState } from "../types";
import {
  uploadFileToOSS,
  type OSSConfig,
  type OSSCredentials,
} from "@/features/oss";

export function useOSSCoverUpload() {
  const [coverUpload, setCoverUpload] = useState<CoverUploadState | null>(null);
  const [credentials, setCredentials] = useState<OSSCredentials | null>(null);

  const ossConfig: OSSConfig = {
    bucket: process.env.NEXT_PUBLIC_OSS_BUCKET || "shirin-123",
    region: process.env.NEXT_PUBLIC_OSS_REGION || "oss-cn-beijing",
  };

  const handleCoverSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 重置状态
      setCoverUpload({
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
      });

      try {
        const url = await uploadFileToOSS(
          file,
          "cover",
          ossConfig,
          credentials,
          setCredentials,
          (progress) => {
            setCoverUpload((prev) => (prev ? { ...prev, progress } : null));
          },
        );
        setCoverUpload((prev) =>
          prev
            ? {
                ...prev,
                status: "success",
                url,
                progress: 100,
              }
            : null,
        );
      } catch (error) {
        setCoverUpload((prev) =>
          prev
            ? {
                ...prev,
                status: "failed",
                error: error instanceof Error ? error.message : "上传失败",
              }
            : null,
        );
      }
    },
    [credentials, ossConfig],
  );

  const resetCover = useCallback(() => {
    setCoverUpload(null);
  }, []);

  return {
    coverUpload,
    handleCoverSelect,
    resetCover,
  };
}

import { useState, useRef, useEffect, useCallback } from "react";
import { VideoUploadState } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AliyunUploadType = any;

interface GetUploadAuthParams {
  fileName: string;
  videoId?: string;
  videoName?: string;
}

export function useAliyunVodUpload(
  ossReady: boolean,
  uploadReady: boolean,
  videoName?: string,
) {
  const [videoUpload, setVideoUpload] = useState<VideoUploadState | null>(null);
  const uploaderRef = useRef<AliyunUploadType>(null);

  // 获取 VOD 上传凭证
  const getUploadAuth = useCallback(
    async ({ fileName, videoId, videoName: name }: GetUploadAuthParams) => {
      const params = new URLSearchParams({
        title: name || fileName,
        fileName,
      });
      if (videoId) {
        params.append("videoId", videoId);
      }

      const response = await fetch(`/api/video/upload/request?${params}`);
      if (!response.ok) {
        throw new Error("Failed to get upload auth");
      }
      const data = await response.json();
      return {
        uploadAuth: data.body?.uploadAuth || data.uploadAuth,
        uploadAddress: data.body?.uploadAddress || data.uploadAddress,
        videoId: data.body?.videoId || data.videoId,
      };
    },
    [],
  );

  // 刷新上传凭证
  const refreshUploadAuth = useCallback(
    async (videoId: string, fileName: string) => {
      return getUploadAuth({ fileName, videoId, videoName });
    },
    [getUploadAuth, videoName],
  );

  // 初始化上传器
  useEffect(() => {
    if (!ossReady || !uploadReady || typeof window === "undefined") return;

    const win = window as Window & {
      AliyunUpload?: {
        Vod: new (options: AliyunUploadType) => AliyunUploadType;
        [key: string]: AliyunUploadType;
      };
    };

    if (win.AliyunUpload && !uploaderRef.current) {
      const uploaderInstance = new win.AliyunUpload.Vod({
        userId: "122",
        region: "cn-shanghai",
        partSize: 1048576,
        parallel: 5,
        retryCount: 3,
        retryDuration: 2,
        enableUploadProgress: true,
        onUploadstarted: async function (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadInfo: any,
        ) {
          try {
            // 判断是否是断点续传
            if (uploadInfo.videoId) {
              // 断点续传
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let checkpoint: any = null;
              if (
                uploaderRef.current &&
                typeof uploaderRef.current.getCheckpoint === "function"
              ) {
                checkpoint = uploaderRef.current.getCheckpoint(uploadInfo.file);
              }

              const { uploadAuth, uploadAddress, videoId } =
                await refreshUploadAuth(
                  uploadInfo.videoId,
                  uploadInfo.file.name,
                );

              if (uploaderRef.current) {
                uploaderRef.current.setUploadAuthAndAddress(
                  uploadInfo,
                  uploadAuth,
                  uploadAddress,
                  videoId,
                );
              }

              setVideoUpload((prev) => {
                if (!prev || prev.file !== uploadInfo.file) return prev;
                const progress = checkpoint?.loaded
                  ? Math.ceil((checkpoint.loaded / prev.size) * 100)
                  : 0;
                return {
                  ...prev,
                  status: "uploading",
                  videoId,
                  progress,
                };
              });
            } else {
              // 新上传
              const { uploadAuth, uploadAddress, videoId } =
                await getUploadAuth({
                  fileName: uploadInfo.file.name,
                  videoName,
                });

              if (uploaderRef.current) {
                uploaderRef.current.setUploadAuthAndAddress(
                  uploadInfo,
                  uploadAuth,
                  uploadAddress,
                  videoId,
                );
              }

              setVideoUpload((prev) => {
                if (!prev || prev.file !== uploadInfo.file) return prev;
                return { ...prev, status: "uploading", videoId };
              });
            }
          } catch {
            setVideoUpload((prev) => {
              if (!prev || prev.file !== uploadInfo.file) return prev;
              return {
                ...prev,
                status: "failed",
                error: uploadInfo.videoId
                  ? "刷新上传凭证失败"
                  : "获取上传凭证失败",
              };
            });
          }
        },
        onUploadSucceed: function (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadInfo: any,
        ) {
          setVideoUpload((prev) => {
            if (!prev || prev.file !== uploadInfo.file) return prev;
            return {
              ...prev,
              status: "success",
              videoId: uploadInfo.videoId,
              progress: 100,
            };
          });
        },
        onUploadFailed: function (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadInfo: any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: any,
        ) {
          setVideoUpload((prev) => {
            if (!prev || prev.file !== uploadInfo.file) return prev;
            return {
              ...prev,
              status: "failed",
              error: message || code,
            };
          });
        },
        onUploadCanceled: function (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadInfo: any,
        ) {
          setVideoUpload((prev) => {
            if (!prev || prev.file !== uploadInfo.file) return prev;
            return { ...prev, status: "paused" as const };
          });
        },
        onUploadProgress: function (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadInfo: any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalSize: any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          loadedPercent: any,
        ) {
          setVideoUpload((prev) => {
            if (!prev || prev.file !== uploadInfo.file) return prev;
            return { ...prev, progress: Math.ceil(loadedPercent * 100) };
          });
        },
        onUploadTokenExpired: async function (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadInfo: any,
        ) {
          try {
            const { uploadAuth } = await refreshUploadAuth(
              uploadInfo.videoId,
              uploadInfo.file.name,
            );

            if (uploaderRef.current) {
              uploaderRef.current.resumeUploadWithAuth(uploadAuth);
            }
          } catch {
            setVideoUpload((prev) => {
              if (!prev || prev.file !== uploadInfo.file) return prev;
              return {
                ...prev,
                status: "failed",
                error: "刷新上传凭证失败",
              };
            });
          }
        },
        refreshSTSToken: async function () {
          console.log("refreshSTSToken");
        },
        refreshSTSTokenInterval: 1000 * 60 * 60 * 24,
      });

      uploaderRef.current = uploaderInstance;
    }
  }, [ossReady, uploadReady, getUploadAuth, refreshUploadAuth, videoName]);

  // 处理视频选择
  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 重置状态
      setVideoUpload({
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "pending",
      });

      // 添加文件到上传器
      if (uploaderRef.current) {
        uploaderRef.current.addFile(file, null, null, null, null);
        const uploadList = uploaderRef.current.listFiles();
        const uploadIndex = uploadList.findIndex(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.file === file,
        );
        if (uploadIndex !== -1) {
          setVideoUpload((prev) => (prev ? { ...prev, uploadIndex } : null));
        }
      }
    },
    [],
  );

  // 开始上传
  const startUpload = useCallback(() => {
    if (uploaderRef.current) {
      uploaderRef.current.startUpload();
      setVideoUpload((prev) =>
        prev ? { ...prev, status: "uploading" } : null,
      );
    }
  }, []);

  // 暂停上传
  const pauseUpload = useCallback(() => {
    if (uploaderRef.current && videoUpload?.uploadIndex !== undefined) {
      uploaderRef.current.cancelFile(videoUpload.uploadIndex);
      setVideoUpload((prev) =>
        prev ? { ...prev, status: "paused" as const } : null,
      );
    }
  }, [videoUpload]);

  // 继续上传
  const resumeUpload = useCallback(() => {
    if (uploaderRef.current && videoUpload?.uploadIndex !== undefined) {
      uploaderRef.current.resumeFile(videoUpload.uploadIndex);
      uploaderRef.current.startUpload();
      setVideoUpload((prev) =>
        prev ? { ...prev, status: "uploading" } : null,
      );
    }
  }, [videoUpload]);

  // 重置上传
  const resetUpload = useCallback(() => {
    setVideoUpload(null);
    if (uploaderRef.current) {
      // 清理上传器中的文件列表
      const files = uploaderRef.current.listFiles();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      files.forEach((file: any, index: number) => {
        uploaderRef.current.cancelFile(index);
      });
    }
  }, []);

  return {
    videoUpload,
    handleVideoSelect,
    startUpload,
    pauseUpload,
    resumeUpload,
    resetUpload,
  };
}

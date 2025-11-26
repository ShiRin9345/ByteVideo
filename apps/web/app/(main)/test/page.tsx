"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AliyunUploadType = any;

interface UploadFile {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "paused" | "success" | "failed";
  videoId?: string;
  error?: string;
  uploadIndex?: number; // 在上传器中的索引
}

export default function TestPage() {
  const [ossReady, setOssReady] = useState(false);
  const [uploadReady, setUploadReady] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderRef = useRef<AliyunUploadType>(null);

  // 获取上传凭证
  const getUploadAuth = async (fileName: string, videoId?: string) => {
    const params = new URLSearchParams({
      title: title || fileName,
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
  };

  // 刷新上传凭证
  const refreshUploadAuth = async (videoId: string, fileName: string) => {
    const params = new URLSearchParams({
      title: title || fileName,
      fileName,
      videoId,
    });

    const response = await fetch(`/api/video/upload/request?${params}`);
    if (!response.ok) {
      throw new Error("Failed to refresh upload auth");
    }
    const data = await response.json();
    return {
      uploadAuth: data.body?.uploadAuth || data.uploadAuth,
      uploadAddress: data.body?.uploadAddress || data.uploadAddress,
      videoId: data.body?.videoId || data.videoId,
    };
  };

  useEffect(() => {
    if (ossReady && uploadReady && typeof window !== "undefined") {
      const win = window as Window & {
        AliyunUpload?: {
          Vod: new (options: AliyunUploadType) => AliyunUploadType;
          [key: string]: AliyunUploadType;
        };
      };

      if (win.AliyunUpload && !uploaderRef.current) {
        // 注意：OSS SDK 可能会显示关于 refreshSTSToken 的警告
        // 我们使用的是上传地址和凭证方式（UploadAuth），不是 STS Token 方式
        // 这个警告可以安全忽略，不影响功能
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
                // 断点续传：打印断点信息
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let checkpoint: any = null;
                if (
                  uploaderRef.current &&
                  typeof uploaderRef.current.getCheckpoint === "function"
                ) {
                  checkpoint = uploaderRef.current.getCheckpoint(
                    uploadInfo.file,
                  );
                  console.log("断点续传信息:", checkpoint);
                }

                // 调用刷新视频上传凭证接口
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

                setFiles((prev) =>
                  prev.map((f) => {
                    const progress = checkpoint?.loaded
                      ? Math.ceil((checkpoint.loaded / f.size) * 100)
                      : 0;
                    return f.file === uploadInfo.file
                      ? {
                          ...f,
                          status: "uploading",
                          videoId,
                          progress,
                        }
                      : f;
                  }),
                );
              } else {
                // 新上传：调用创建视频上传凭证接口
                const { uploadAuth, uploadAddress, videoId } =
                  await getUploadAuth(uploadInfo.file.name);

                if (uploaderRef.current) {
                  uploaderRef.current.setUploadAuthAndAddress(
                    uploadInfo,
                    uploadAuth,
                    uploadAddress,
                    videoId,
                  );
                }

                setFiles((prev) =>
                  prev.map((f) =>
                    f.file === uploadInfo.file
                      ? { ...f, status: "uploading", videoId }
                      : f,
                  ),
                );
              }
            } catch {
              setFiles((prev) =>
                prev.map((f) =>
                  f.file === uploadInfo.file
                    ? {
                        ...f,
                        status: "failed",
                        error: uploadInfo.videoId
                          ? "刷新上传凭证失败"
                          : "获取上传凭证失败",
                      }
                    : f,
                ),
              );
            }
          },
          onUploadSucceed: function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uploadInfo: any,
          ) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === uploadInfo.file
                  ? { ...f, status: "success", videoId: uploadInfo.videoId }
                  : f,
              ),
            );
          },
          onUploadFailed: function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uploadInfo: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: any,
          ) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === uploadInfo.file
                  ? { ...f, status: "failed", error: message || code }
                  : f,
              ),
            );
          },
          onUploadCanceled: function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uploadInfo: any,
          ) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === uploadInfo.file
                  ? { ...f, status: "paused" as const }
                  : f,
              ),
            );
          },
          onUploadProgress: function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uploadInfo: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalSize: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            loadedPercent: any,
          ) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === uploadInfo.file
                  ? { ...f, progress: Math.ceil(loadedPercent * 100) }
                  : f,
              ),
            );
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
              setFiles((prev) =>
                prev.map((f) =>
                  f.file === uploadInfo.file
                    ? {
                        ...f,
                        status: "failed",
                        error: "刷新上传凭证失败",
                      }
                    : f,
                ),
              );
            }
          },
          refreshSTSToken: async function () {
            console.log("refreshSTSToken");
          },
          refreshSTSTokenInterval: 1000 * 60 * 60 * 24,
        });

        uploaderRef.current = uploaderInstance;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ossReady, uploadReady]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending" as const,
    }));

    setFiles((prev) => {
      const updatedFiles = [...prev, ...newFiles];

      // 添加文件到上传器并更新索引
      if (uploaderRef.current) {
        newFiles.forEach((fileItem, idx) => {
          uploaderRef.current.addFile(fileItem.file, null, null, null, null);
          // 获取文件在上传器中的索引
          const uploadList = uploaderRef.current.listFiles();
          const uploadIndex = uploadList.findIndex(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => item.file === fileItem.file,
          );
          if (uploadIndex !== -1) {
            const fileIndex = prev.length + idx;
            const targetFile = updatedFiles[fileIndex];
            if (targetFile) {
              targetFile.uploadIndex = uploadIndex;
            }
          }
        });
      }

      return updatedFiles;
    });
  };

  const handleStartUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.startUpload();
    }
  };

  const handlePauseUpload = (index: number) => {
    const file = files[index];
    if (!file) return;

    if (uploaderRef.current && file.uploadIndex !== undefined) {
      // 使用 cancelFile 暂停上传
      uploaderRef.current.cancelFile(file.uploadIndex);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "paused" as const } : f,
        ),
      );
    }
  };

  const handleResumeUpload = (index: number) => {
    const file = files[index];
    if (!file) return;

    if (uploaderRef.current && file.uploadIndex !== undefined) {
      // 先恢复文件状态
      uploaderRef.current.resumeFile(file.uploadIndex);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "uploading" as const } : f,
        ),
      );
      // 继续上传
      uploaderRef.current.startUpload();
    }
  };

  const handleRemoveFile = (index: number) => {
    const file = files[index];
    if (!file) return;

    if (uploaderRef.current && file.uploadIndex !== undefined) {
      uploaderRef.current.deleteFile(file.uploadIndex);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      <Script
        src="/lib/aliyun-oss-sdk-6.17.1.min.js"
        strategy="lazyOnload"
        onLoad={() => setOssReady(true)}
      />
      <Script
        src="/lib/aliyun-upload-sdk-1.5.7.min.js"
        strategy="lazyOnload"
        onLoad={() => setUploadReady(true)}
      />

      <div className="container mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-bold">视频上传</h1>

        <div className="mb-6 space-y-4">
          <div>
            <Label htmlFor="title">视频标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入视频标题（可选）"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="file">选择视频文件</Label>
            <Input
              id="file"
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {files.length > 0 && (
            <Button onClick={handleStartUpload} className="w-full">
              开始上传
            </Button>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">上传列表</h2>
            {files.map((file, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "uploading" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseUpload(index)}
                      >
                        暂停
                      </Button>
                    )}
                    {file.status === "paused" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResumeUpload(index)}
                      >
                        继续
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      删除
                    </Button>
                  </div>
                </div>

                {(file.status === "uploading" || file.status === "paused") && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {file.status === "uploading" ? "上传中..." : "已暂停"}
                      </span>
                      <span>{file.progress}%</span>
                    </div>
                    <div className="bg-secondary h-2 w-full rounded-full">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {file.status === "success" && (
                  <div className="text-sm text-green-600">
                    ✓ 上传成功 {file.videoId && `(Video ID: ${file.videoId})`}
                  </div>
                )}

                {file.status === "failed" && (
                  <div className="text-sm text-red-600">
                    ✗ 上传失败: {file.error}
                  </div>
                )}

                {file.status === "pending" && (
                  <div className="text-muted-foreground text-sm">
                    等待上传...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!ossReady || !uploadReady ? (
          <div className="text-muted-foreground py-8 text-center">
            正在加载上传组件...
          </div>
        ) : null}
      </div>
    </>
  );
}

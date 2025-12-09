"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { apiClient } from "@/lib/axios";
import {
  type OSSCredentials,
  type OSSConfig,
  uploadFileToOSS,
} from "@/features/oss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AliyunUploadType = any;

interface VideoUploadState {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "paused" | "success" | "failed";
  videoId?: string; // VOD videoId
  error?: string;
  uploadIndex?: number; // 在上传器中的索引
}

interface CoverUploadState {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "success" | "failed";
  url?: string;
  error?: string;
}

export default function TestPage() {
  const [credentials, setCredentials] = useState<OSSCredentials | null>(null);
  const [ossReady, setOssReady] = useState(false);
  const [uploadReady, setUploadReady] = useState(false);

  // 视频上传状态
  const [videoUpload, setVideoUpload] = useState<VideoUploadState | null>(null);

  // 封面图上传状态
  const [coverUpload, setCoverUpload] = useState<CoverUploadState | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    tags: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uploaderRef = useRef<AliyunUploadType>(null);

  // OSS 配置
  const ossConfig: OSSConfig = {
    bucket: process.env.NEXT_PUBLIC_OSS_BUCKET || "shirin-123",
    region: process.env.NEXT_PUBLIC_OSS_REGION || "oss-cn-beijing",
  };

  // 获取 VOD 上传凭证
  const getUploadAuth = async (fileName: string, videoId?: string) => {
    const params = new URLSearchParams({
      title: formData.name || fileName,
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
      title: formData.name || fileName,
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

  // 初始化 VOD 上传器
  useEffect(() => {
    if (ossReady && uploadReady && typeof window !== "undefined") {
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
                  checkpoint = uploaderRef.current.getCheckpoint(
                    uploadInfo.file,
                  );
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
                  await getUploadAuth(uploadInfo.file.name);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ossReady, uploadReady]);

  /**
   * 处理视频选择 - 使用 VOD 上传
   */
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  /**
   * 开始视频上传
   */
  const handleStartVideoUpload = () => {
    if (uploaderRef.current && videoUpload) {
      uploaderRef.current.startUpload();
      setVideoUpload((prev) =>
        prev ? { ...prev, status: "uploading" } : null,
      );
    }
  };

  /**
   * 暂停视频上传
   */
  const handlePauseVideoUpload = () => {
    if (uploaderRef.current && videoUpload?.uploadIndex !== undefined) {
      uploaderRef.current.cancelFile(videoUpload.uploadIndex);
      setVideoUpload((prev) =>
        prev ? { ...prev, status: "paused" as const } : null,
      );
    }
  };

  /**
   * 继续视频上传
   */
  const handleResumeVideoUpload = () => {
    if (uploaderRef.current && videoUpload?.uploadIndex !== undefined) {
      uploaderRef.current.resumeFile(videoUpload.uploadIndex);
      uploaderRef.current.startUpload();
      setVideoUpload((prev) =>
        prev ? { ...prev, status: "uploading" } : null,
      );
    }
  };

  /**
   * 处理封面图选择
   */
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // 验证必填字段
    if (
      !videoUpload ||
      videoUpload.status !== "success" ||
      !videoUpload.videoId
    ) {
      setSubmitError("请先上传视频");
      return;
    }

    if (!coverUpload || coverUpload.status !== "success" || !coverUpload.url) {
      setSubmitError("请先上传封面图");
      return;
    }

    if (!formData.name.trim()) {
      setSubmitError("请输入视频名称");
      return;
    }

    if (!formData.theme.trim()) {
      setSubmitError("请输入主题");
      return;
    }

    // 解析主题和标签（支持逗号分隔）
    const themeArray = formData.theme
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSubmitting(true);

    try {
      // 使用 VOD 返回的 videoId
      const videoId = videoUpload.videoId!;

      await apiClient.post("/video/publish", {
        videoId,
        name: formData.name.trim(),
        theme: themeArray,
        description: formData.description.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        coverUrl: coverUpload.url,
      });

      setSubmitSuccess(true);

      // 重置表单
      setTimeout(() => {
        setFormData({ name: "", theme: "", description: "", tags: "" });
        setVideoUpload(null);
        setCoverUpload(null);
        setSubmitSuccess(false);
        if (videoInputRef.current) videoInputRef.current.value = "";
        if (coverInputRef.current) coverInputRef.current.value = "";
      }, 2000);
    } catch (error: unknown) {
      // 处理 axios 错误
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        setSubmitError(
          axiosError.response?.data?.message || "发布失败，请重试",
        );
      } else {
        setSubmitError(
          error instanceof Error ? error.message : "发布失败，请重试",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="mb-6 text-2xl font-bold">视频发布</h1>

        <Card>
          <CardHeader>
            <CardTitle>上传视频和封面图</CardTitle>
            <CardDescription>
              视频将上传到 VOD，封面图将上传到 OSS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* 视频上传 */}
              <div className="space-y-2">
                <Label htmlFor="video">选择视频 *</Label>
                <Input
                  id="video"
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="mt-1"
                  disabled={!ossReady || !uploadReady}
                />
                {!ossReady || !uploadReady ? (
                  <p className="text-muted-foreground text-sm">
                    正在加载上传组件...
                  </p>
                ) : null}
                {videoUpload && (
                  <div className="mt-2 space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {videoUpload.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatFileSize(videoUpload.size)}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {videoUpload.status === "pending" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleStartVideoUpload}
                          >
                            开始上传
                          </Button>
                        )}
                        {videoUpload.status === "uploading" && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handlePauseVideoUpload}
                            >
                              暂停
                            </Button>
                            <span className="text-sm text-blue-600">
                              上传中...
                            </span>
                          </>
                        )}
                        {videoUpload.status === "paused" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResumeVideoUpload}
                          >
                            继续
                          </Button>
                        )}
                        {videoUpload.status === "success" && (
                          <span className="text-sm text-green-600">
                            ✓ 上传成功
                            {videoUpload.videoId && (
                              <span className="ml-2 text-xs">
                                (Video ID: {videoUpload.videoId})
                              </span>
                            )}
                          </span>
                        )}
                        {videoUpload.status === "failed" && (
                          <span className="text-sm text-red-600">
                            ✗ {videoUpload.error}
                          </span>
                        )}
                      </div>
                    </div>
                    {(videoUpload.status === "uploading" ||
                      videoUpload.status === "paused") && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>
                            {videoUpload.status === "uploading"
                              ? "上传中..."
                              : "已暂停"}
                          </span>
                          <span>{videoUpload.progress}%</span>
                        </div>
                        <div className="bg-secondary h-2 w-full rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${videoUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 封面图上传 */}
              <div className="space-y-2">
                <Label htmlFor="cover">选择封面图 *</Label>
                <Input
                  id="cover"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="mt-1"
                />
                {coverUpload && (
                  <div className="mt-2 space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {coverUpload.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatFileSize(coverUpload.size)}
                        </p>
                      </div>
                      <div className="ml-4">
                        {coverUpload.status === "uploading" && (
                          <span className="text-sm text-blue-600">
                            上传中...
                          </span>
                        )}
                        {coverUpload.status === "success" && (
                          <span className="text-sm text-green-600">
                            ✓ 上传成功
                          </span>
                        )}
                        {coverUpload.status === "failed" && (
                          <span className="text-sm text-red-600">
                            ✗ {coverUpload.error}
                          </span>
                        )}
                      </div>
                    </div>
                    {coverUpload.status === "uploading" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>上传进度</span>
                          <span>{coverUpload.progress}%</span>
                        </div>
                        <div className="bg-secondary h-2 w-full rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${coverUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {coverUpload.status === "success" && coverUpload.url && (
                      <div className="space-y-2">
                        <a
                          href={coverUpload.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs underline"
                        >
                          查看封面图
                        </a>
                        <img
                          src={coverUpload.url}
                          alt="封面预览"
                          className="mt-2 max-h-48 w-auto rounded border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 视频名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">视频名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入视频名称"
                  required
                />
              </div>

              {/* 主题 */}
              <div className="space-y-2">
                <Label htmlFor="theme">主题 *（多个主题用逗号分隔）</Label>
                <Input
                  id="theme"
                  value={formData.theme}
                  onChange={(e) =>
                    setFormData({ ...formData, theme: e.target.value })
                  }
                  placeholder="例如: 科技,编程,教程"
                  required
                />
              </div>

              {/* 描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入视频描述（可选）"
                  rows={4}
                />
              </div>

              {/* 标签 */}
              <div className="space-y-2">
                <Label htmlFor="tags">标签（多个标签用逗号分隔）</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="例如: 前端,React,Next.js"
                />
              </div>

              {/* 错误提示 */}
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              {/* 成功提示 */}
              {submitSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                  ✓ 发布成功！
                </div>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  !videoUpload ||
                  videoUpload.status !== "success" ||
                  !videoUpload.videoId ||
                  !coverUpload ||
                  coverUpload.status !== "success"
                }
              >
                {isSubmitting ? "发布中..." : "发布视频"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

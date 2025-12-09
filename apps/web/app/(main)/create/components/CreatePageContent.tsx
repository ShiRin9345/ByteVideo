"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useAliyunVodUpload } from "../hooks/use-aliyun-vod";
import { useOSSCoverUpload } from "../hooks/use-oss-cover";
import { VideoUploader } from "./video-uploader";
import { CoverUploader } from "./cover-uploader";

export function CreatePageContent() {
  const searchParams = useSearchParams();
  const [ossReady, setOssReady] = useState(false);
  const [uploadReady, setUploadReady] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    tags: "",
  });

  // 从 URL 参数中获取 AI 生成的信息
  const aiGeneratedVideoUrl = searchParams.get("videoUrl");
  const aiGenerated = searchParams.get("aiGenerated") === "true";

  // 使用自定义 Hooks
  const {
    videoUpload,
    handleVideoSelect,
    startUpload,
    pauseUpload,
    resumeUpload,
    resetUpload,
  } = useAliyunVodUpload(ossReady, uploadReady, formData.name);

  const { coverUpload, handleCoverSelect, resetCover } = useOSSCoverUpload();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 初始化表单数据（从 URL 参数）
  useEffect(() => {
    const tags = searchParams.get("tags");
    const prompt = searchParams.get("prompt");

    if (tags) {
      setFormData((prev) => ({ ...prev, tags }));
    }

    if (prompt) {
      // 使用提示词作为视频名称的默认值（仅在名称为空时）
      setFormData((prev) => {
        if (!prev.name) {
          return { ...prev, name: prompt.substring(0, 50) };
        }
        return prev;
      });
    }
  }, [searchParams]);

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
        resetUpload();
        resetCover();
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
              {/* AI 生成提示 */}
              {aiGenerated && aiGeneratedVideoUrl && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">
                    ✨ 来自 AI 生成的视频
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    请先下载 AI 生成的视频，然后上传到平台进行发布。
                  </p>
                  <a
                    href={aiGeneratedVideoUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-2 inline-block text-sm underline"
                  >
                    下载视频 →
                  </a>
                </div>
              )}

              {/* 视频上传组件 */}
              <VideoUploader
                videoUpload={videoUpload}
                onSelect={handleVideoSelect}
                onStart={startUpload}
                onPause={pauseUpload}
                onResume={resumeUpload}
                disabled={!ossReady || !uploadReady}
              />

              {/* 封面图上传组件 */}
              <CoverUploader
                coverUpload={coverUpload}
                onSelect={handleCoverSelect}
              />

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

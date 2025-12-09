"use client";

import { useRef } from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { VideoUploadState } from "../types";

interface VideoUploaderProps {
  videoUpload: VideoUploadState | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export function VideoUploader({
  videoUpload,
  onSelect,
  onStart,
  onPause,
  onResume,
  disabled,
}: VideoUploaderProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor="video">选择视频 *</Label>
      <Input
        id="video"
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={onSelect}
        className="mt-1"
        disabled={disabled}
      />
      {disabled && (
        <p className="text-muted-foreground text-sm">正在加载上传组件...</p>
      )}
      {videoUpload && (
        <div className="mt-2 space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{videoUpload.name}</p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(videoUpload.size)}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              {videoUpload.status === "pending" && (
                <Button type="button" size="sm" onClick={onStart}>
                  开始上传
                </Button>
              )}
              {videoUpload.status === "uploading" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onPause}
                  >
                    暂停
                  </Button>
                  <span className="text-sm text-blue-600">上传中...</span>
                </>
              )}
              {videoUpload.status === "paused" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onResume}
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
                  {videoUpload.status === "uploading" ? "上传中..." : "已暂停"}
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
  );
}

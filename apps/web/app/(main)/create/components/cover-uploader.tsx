"use client";

import { useRef } from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { CoverUploadState } from "../types";

interface CoverUploaderProps {
  coverUpload: CoverUploadState | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export function CoverUploader({ coverUpload, onSelect }: CoverUploaderProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor="cover">选择封面图 *</Label>
      <Input
        id="cover"
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={onSelect}
        className="mt-1"
      />
      {coverUpload && (
        <div className="mt-2 space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{coverUpload.name}</p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(coverUpload.size)}
              </p>
            </div>
            <div className="ml-4">
              {coverUpload.status === "uploading" && (
                <span className="text-sm text-blue-600">上传中...</span>
              )}
              {coverUpload.status === "success" && (
                <span className="text-sm text-green-600">✓ 上传成功</span>
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
  );
}

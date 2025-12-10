"use client";

import * as React from "react";
import { Upload, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { useAuth } from "@/features/auth";
import {
  uploadFileToOSS,
  type OSSConfig,
  type OSSCredentials,
} from "@/features/oss";
import { updateUserAvatar } from "@/features/auth/lib/auth-api";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
}: AvatarUploadDialogProps) {
  const { refreshUser } = useAuth();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [credentials, setCredentials] = React.useState<OSSCredentials | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const ossConfig: OSSConfig = {
    bucket: process.env.NEXT_PUBLIC_OSS_BUCKET || "shirin-123",
    region: process.env.NEXT_PUBLIC_OSS_REGION || "oss-cn-beijing",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    // 验证文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 上传到 OSS
      const url = await uploadFileToOSS(
        file,
        "avatar",
        ossConfig,
        credentials,
        setCredentials,
      );

      // 更新用户头像
      await updateUserAvatar(url);

      // 刷新用户信息
      await refreshUser();

      // 关闭对话框
      onOpenChange(false);

      // 重置状态
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更换头像</DialogTitle>
          <DialogDescription>
            选择一张图片作为你的头像。支持 JPG、PNG 等格式，文件大小不超过 5MB。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {error && (
            <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          {uploading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>上传中...</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              <X className="mr-2 h-4 w-4" />
              取消
            </Button>
            <Button onClick={handleClick} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              选择图片
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

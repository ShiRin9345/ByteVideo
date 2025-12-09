"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { apiClient } from "@/lib/axios";
import { toast } from "@workspace/ui/components/sonner";
import type { VideoItem } from "@/features/ai/api/video-list";

interface EditVideoDialogProps {
  video: VideoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditVideoDialog({
  video,
  open,
  onOpenChange,
  onSuccess,
}: EditVideoDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [themeInput, setThemeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当视频数据变化时，更新表单
  useEffect(() => {
    if (video) {
      setName(video.name);
      setThemeInput(video.theme.join(", "));
    }
  }, [video]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("请输入视频名称");
      return;
    }

    const themeArray = themeInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (themeArray.length === 0) {
      toast.error("请输入至少一个主题");
      return;
    }

    if (!video) {
      toast.error("未选择视频");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.put(`/video/${video.id}`, {
        name: name.trim(),
        theme: themeArray,
      });
      toast.success("视频信息更新成功");
      onSuccess();
      onOpenChange(false);
      // 刷新页面以获取最新数据（SSR）
      router.refresh();
    } catch (error) {
      toast.error("更新失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑视频信息</DialogTitle>
          <DialogDescription>修改视频名称和主题标签</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">视频名称</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入视频名称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-theme">主题（多个主题用逗号分隔）</Label>
              <Input
                id="edit-theme"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="例如: 科技,编程,教程"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

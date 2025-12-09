"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useAuth } from "@/features/auth";
import {
  likeVideo,
  createComment,
  type VideoDetailResponse,
} from "../api/video-detail";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@workspace/ui/components/sonner";

interface VideoInteractionBarProps {
  videoId: string;
  currentLikes: number;
  userImage?: string | null;
  userName?: string;
  onCommentCreated?: () => void;
}

export function VideoInteractionBar({
  videoId,
  currentLikes,
  userImage,
  userName,
  onCommentCreated,
}: VideoInteractionBarProps) {
  const { isAuthenticated } = useAuth();
  const [commentContent, setCommentContent] = useState("");
  const queryClient = useQueryClient();

  // 获取当前数据
  const videoDetailData = queryClient.getQueryData<VideoDetailResponse>([
    "video-detail",
    videoId,
  ]);
  const likes = videoDetailData?.data?.likes ?? currentLikes;

  // 使用 React Query 的 useMutation 进行乐观更新
  const { mutate: toggleLike, isPending: isLikePending } = useMutation({
    mutationFn: () => likeVideo(videoId),
    // 🟢 乐观更新核心：在请求发出去之前运行
    onMutate: async () => {
      // 1. 取消相关的正在进行的查询，防止旧数据覆盖
      await queryClient.cancelQueries({ queryKey: ["video-detail", videoId] });

      // 2. 保存旧数据快照（用于回滚）
      const previousData = queryClient.getQueryData<VideoDetailResponse>([
        "video-detail",
        videoId,
      ]);

      // 3. 乐观地更新缓存
      queryClient.setQueryData<VideoDetailResponse>(
        ["video-detail", videoId],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              likes: (old.data.likes || 0) + 1,
            },
          };
        },
      );

      // 返回上下文对象
      return { previousData };
    },
    // 🔴 失败时回滚
    onError: (err, variables, context) => {
      toast.error("点赞失败", {
        description: "网络错误，请稍后重试",
      });
      if (context?.previousData) {
        queryClient.setQueryData(
          ["video-detail", videoId],
          context.previousData,
        );
      }
    },
    // 🔵 无论成功失败，最后都重新验证一次数据，确保准确
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("请先登录", {
        description: "登录后才能点赞",
      });
      return;
    }

    toggleLike(); // 直接调用
  };

  const handleComment = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录", {
        description: "登录后才能评论",
      });
      return;
    }

    if (!commentContent.trim()) {
      toast.error("评论不能为空");
      return;
    }

    try {
      const response = await createComment(videoId, commentContent.trim());
      if (response.success && response.data) {
        setCommentContent("");
        // 更新评论列表和视频详情缓存
        queryClient.invalidateQueries({
          queryKey: ["video-comments", videoId],
        });
        queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
        onCommentCreated?.();
        toast.success("评论成功");
      } else {
        toast.error("评论失败", {
          description: response.error || "未知错误",
        });
      }
    } catch (error) {
      console.error("Create comment error:", error);
      toast.error("评论失败", {
        description: "网络错误，请稍后重试",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <div className="bg-background/95 sticky bottom-0 z-30 flex items-center gap-3 border-t px-4 py-3 backdrop-blur">
      {/* 用户头像 */}
      <Image
        src={userImage || "https://picsum.photos/seed/avatar/40/40"}
        alt={userName || "用户"}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full"
      />
      {/* 输入框 */}
      <Input
        placeholder="说点什么..."
        className="flex-1 rounded-full"
        value={commentContent}
        onChange={(e) => setCommentContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {/* 互动按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 p-0"
          onClick={handleLike}
          disabled={isLikePending}
        >
          <Heart className="h-5 w-5" />
          <span className="text-sm">{likes}</span>
        </Button>
      </div>
    </div>
  );
}

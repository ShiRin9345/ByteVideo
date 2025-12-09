"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@/features/auth";
import { LoginDialog } from "@/components/login-dialog";
import {
  fetchVideoDetail,
  fetchVideoPlayAuth,
  fetchVideoComments,
  type CommentItem,
} from "@/features/video/api/video-detail";
import { VideoInteractionBar } from "@/features/video/components/VideoInteractionBar";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

// 动态导入 VideoPlayer 组件（包含大型播放器 SDK）
const VideoPlayer = dynamic(
  () =>
    import("@/components/VideoPlayer").then((mod) => ({
      default: mod.VideoPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full items-center justify-center bg-black">
        <p className="text-muted-foreground">加载播放器中...</p>
      </div>
    ),
  },
);

function VideoPlayerComponent({
  videoId,
  playauth,
}: {
  videoId: string;
  playauth: string;
}) {
  return (
    <div className="aspect-video w-full">
      <VideoPlayer videoId={videoId} playauth={playauth} />
    </div>
  );
}

export default function VideoWatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // 这是数据库中的 id，不是 videoId
  const { isAuthenticated, loading, user } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [playauth, setPlayauth] = useState<string | null>(null);

  // 获取视频详情
  const {
    data: videoResponse,
    isLoading: isLoadingVideo,
    error: videoError,
  } = useQuery({
    queryKey: ["video-detail", id],
    queryFn: () => fetchVideoDetail(id),
    enabled: !!id,
  });

  const videoData = videoResponse?.data;

  // 获取评论列表
  const {
    data: commentsResponse,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["video-comments", id],
    queryFn: () => fetchVideoComments(id),
    enabled: !!id && !!videoData,
  });

  const comments: CommentItem[] = commentsResponse?.data || [];

  // 获取播放权限
  useEffect(() => {
    if (videoData?.videoId) {
      fetchVideoPlayAuth(videoData.videoId)
        .then((response) => {
          const playAuth = response.body.playInfoList.playInfo[0].playURL;
          if (playAuth) {
            setPlayauth(playAuth);
          }
        })
        .catch((error) => {
          console.error("Failed to get play auth:", error);
        });
    }
  }, [videoData?.videoId]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLoginDialogOpen(true);
    }
  }, [loading, isAuthenticated]);

  // 加载中或错误状态
  if (isLoadingVideo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (videoError || !videoData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">
            视频不存在或加载失败
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* 统一使用移动端布局 */}
      <div className="flex flex-col">
        {/* 作者信息 - Sticky 头部 */}
        <div className="bg-background/95 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur">
          <Image
            src={
              videoData.author.image ||
              "https://picsum.photos/seed/avatar/40/40"
            }
            alt={videoData.author.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex-1">
            <p className="font-medium">{videoData.author.name}</p>
          </div>
        </div>

        {/* 视频播放器 */}
        {playauth ? (
          <div className="w-full bg-black">
            <VideoPlayerComponent
              videoId={videoData.videoId}
              playauth={playauth}
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-black">
            <p className="text-muted-foreground">加载播放权限中...</p>
          </div>
        )}

        {/* 视频信息 */}
        <div className="space-y-4 px-4 py-4">
          {/* 标题和描述 */}
          <div>
            <h1 className="mb-2 text-lg font-semibold">{videoData.name}</h1>
            {videoData.description && (
              <p className="text-muted-foreground text-sm">
                {videoData.description}
              </p>
            )}
          </div>

          {/* 主题标签 */}
          {videoData.theme && videoData.theme.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {videoData.theme.map((theme, index) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* 标签 */}
          {videoData.tags && videoData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {videoData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Separator />

          {/* 评论区域 */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">
              共{videoData.comments}条评论
            </h2>
            {isLoadingComments ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                加载评论中...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                暂无评论
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Image
                      src={
                        comment.author.image ||
                        "https://picsum.photos/seed/avatar/32/32"
                      }
                      alt={comment.author.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {dayjs(comment.createdAt).format("MM-DD HH:mm")}
                        </span>
                      </div>
                      <p className="mb-2 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky 底部交互栏 */}
        <VideoInteractionBar
          videoId={id}
          currentLikes={videoData.likes}
          userImage={user?.image}
          userName={user?.name}
          onCommentCreated={() => refetchComments()}
        />
      </div>

      {/* Login Dialog */}
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { useState, useEffect } from "react";
import { VideoPlayer } from "@/features/player/components/VideoPlayer";
import Image from "next/image";
import { useAuth } from "@/features/auth";
import { LoginDialog } from "@/components/login-dialog";

// 模拟获取视频数据
function getVideoData(id: string) {
  // 这里应该从 API 获取真实数据
  return {
    id,
    title: "在线问,这样的反诈宣传能入心入脑吗?",
    description: "这是一段关于反诈宣传的视频内容",
    author: {
      name: "环球网",
      avatar: "https://picsum.photos/seed/avatar/40/40",
    },
    tags: ["#反诈开学第一课", "#反诈", "#反诈骗", "#反诈知识", "#知识就是力量"],
    stats: {
      views: 10000,
      likes: 1000,
      comments: 100,
    },
    videoId: "10d5c255c9b971f0867e1777b3cf0102",
    playauth: "mock-playauth-token",
    publishTime: "11-12",
    location: "陕西",
  };
}

// 模拟获取评论数据
function getComments() {
  return [
    {
      id: 1,
      author: {
        name: "Tim",
        avatar: "https://picsum.photos/seed/user1/40/40",
      },
      content: "太暗了,根本看不清,到我屋里再演一遍",
      likes: 10,
      replies: 5,
      time: "11-12",
      location: "辽宁",
    },
    {
      id: 2,
      author: {
        name: "Tim",
        avatar: "https://picsum.photos/seed/user2/40/40",
      },
      content: "这个视频很有意思",
      likes: 2,
      replies: 0,
      time: "11-12",
      location: "辽宁",
    },
  ];
}

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
  const videoId = params.id as string;
  const videoData = getVideoData(videoId);
  const comments = getComments();
  const { isAuthenticated, loading } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // 检查登录状态，如果未登录则显示登录对话框
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLoginDialogOpen(true);
    }
  }, [loading, isAuthenticated]);

  return (
    <div className="bg-background min-h-screen">
      {/* 移动端：垂直布局 */}
      <div className="flex flex-col md:hidden">
        {/* 返回按钮 */}
        <div className="bg-background/95 sticky top-0 z-30 flex items-center gap-4 border-b px-4 py-3 backdrop-blur">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </div>

        {/* 视频播放器 */}
        <div className="w-full bg-black">
          <VideoPlayerComponent
            videoId={videoData.videoId}
            playauth={videoData.playauth}
          />
        </div>

        {/* 视频信息 */}
        <div className="space-y-4 px-4 py-4">
          {/* 作者信息 */}
          <div className="flex items-center gap-3">
            <Image
              src={videoData.author.avatar}
              alt={videoData.author.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium">{videoData.author.name}</p>
              <p className="text-muted-foreground text-sm">
                {videoData.publishTime} {videoData.location}
              </p>
            </div>
            <Button variant="default" size="sm">
              关注
            </Button>
          </div>

          {/* 标题和描述 */}
          <div>
            <h1 className="mb-2 text-lg font-semibold">{videoData.title}</h1>
            <p className="text-muted-foreground text-sm">
              {videoData.description}
            </p>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {videoData.tags.map((tag) => (
              <span
                key={tag}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 互动按钮 */}
          <div className="flex items-center gap-4 pt-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <ThumbsUp className="h-4 w-4" />
              {videoData.stats.likes}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {videoData.stats.comments}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              分享
            </Button>
          </div>

          <Separator />

          {/* 评论区域 */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">
              共{comments.length}+条评论
            </h2>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Image
                    src={comment.author.avatar}
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
                        {comment.time} {comment.location}
                      </span>
                    </div>
                    <p className="mb-2 text-sm">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="h-6 gap-1">
                        <Heart className="h-3 w-3" />
                        {comment.likes}
                      </Button>
                      {comment.replies > 0 && (
                        <Button variant="ghost" size="sm" className="h-6">
                          回复 {comment.replies}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端：水平布局 */}
      <div className="hidden md:flex">
        <div className="mx-auto max-w-7xl flex-1 px-6 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧：视频播放器和信息 */}
            <div className="col-span-12 space-y-6 lg:col-span-8">
              {/* 返回按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>

              {/* 视频播放器 */}
              <div className="w-full overflow-hidden rounded-lg bg-black">
                <VideoPlayerComponent
                  videoId={videoData.videoId}
                  playauth={videoData.playauth}
                />
              </div>

              {/* 视频信息 */}
              <Card>
                <CardHeader>
                  <div className="mb-4 flex items-center gap-3">
                    <Image
                      src={videoData.author.avatar}
                      alt={videoData.author.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{videoData.author.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {videoData.publishTime} {videoData.location}
                      </p>
                    </div>
                    <Button variant="default" size="sm">
                      关注
                    </Button>
                  </div>
                  <CardTitle>{videoData.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {videoData.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {videoData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      {videoData.stats.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {videoData.stats.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      分享
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：评论 */}
            <div className="col-span-12 space-y-6 lg:col-span-4">
              {/* 评论区域 */}
              <Card>
                <CardHeader>
                  <CardTitle>共{comments.length}+条评论</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] space-y-4 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Image
                          src={comment.author.avatar}
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
                              {comment.time} {comment.location}
                            </span>
                          </div>
                          <p className="mb-2 text-sm">{comment.content}</p>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1"
                            >
                              <Heart className="h-3 w-3" />
                              {comment.likes}
                            </Button>
                            {comment.replies > 0 && (
                              <Button variant="ghost" size="sm" className="h-6">
                                回复 {comment.replies}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
}

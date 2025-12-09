"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import {
  createVideoTask,
  pollTaskResult,
  type VideoGenerateRequest,
  type TaskStatusResponse,
} from "@/features/ai";
import { Loader2, Play, Download, Sparkles } from "lucide-react";

type TaskStatus = "idle" | "pending" | "running" | "succeeded" | "failed";

export default function AIGeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const size = "720*1280";
  const [duration, setDuration] = useState<5 | 10>(5);
  const [promptExtend, setPromptExtend] = useState(false);
  const [audio, setAudio] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("idle");
  const [taskInfo, setTaskInfo] = useState<TaskStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<boolean>(false);

  // 创建生成任务
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("请输入提示词");
      return;
    }

    setError(null);
    setTaskStatus("pending");
    setTaskInfo(null);
    pollingRef.current = false;

    try {
      const params: VideoGenerateRequest = {
        prompt: prompt.trim(),
        size,
        duration,
        prompt_extend: promptExtend,
        audio,
      };

      const response = await createVideoTask(params);
      const newTaskId = response.output.task_id;

      if (!newTaskId) {
        throw new Error("未获取到任务 ID");
      }

      setTaskStatus("running");
      pollingRef.current = true;

      // 开始轮询任务状态
      pollTaskResult(newTaskId, {
        interval: 5000, // 5秒轮询一次
        maxAttempts: 120, // 最多10分钟
        onProgress: (status) => {
          setTaskInfo(status);
          const statusValue = status.output.task_status;
          if (statusValue === "PENDING") {
            setTaskStatus("pending");
          } else if (statusValue === "RUNNING") {
            setTaskStatus("running");
          } else if (statusValue === "SUCCEEDED") {
            setTaskStatus("succeeded");
            pollingRef.current = false;
          } else if (statusValue === "FAILED" || statusValue === "CANCELED") {
            setTaskStatus("failed");
            pollingRef.current = false;
            setError(status.message || "视频生成失败，请重试");
          }
        },
      })
        .then((finalStatus) => {
          setTaskInfo(finalStatus);
          const statusValue = finalStatus.output.task_status;
          if (statusValue === "SUCCEEDED") {
            setTaskStatus("succeeded");
          } else {
            setTaskStatus("failed");
            setError(finalStatus.message || "视频生成失败，请重试");
          }
        })
        .catch((err) => {
          setTaskStatus("failed");
          setError(err instanceof Error ? err.message : "生成任务失败");
          pollingRef.current = false;
        });
    } catch (err) {
      setTaskStatus("failed");
      setError(err instanceof Error ? err.message : "创建任务失败");
      pollingRef.current = false;
    }
  };

  // 发布视频 - 跳转到 create 页面，提示用户下载并上传视频
  const handlePublish = () => {
    if (!taskInfo?.output.video_url) {
      return;
    }

    // 将提示词传递到 create 页面
    const params = new URLSearchParams({
      ...(taskInfo.output.actual_prompt && {
        prompt: taskInfo.output.actual_prompt,
      }),
      aiGenerated: "true",
      videoUrl: taskInfo.output.video_url,
    });

    router.push(`/create?${params.toString()}`);
  };

  const videoUrl = taskInfo?.output.video_url;
  const canGenerate =
    prompt.trim().length > 0 &&
    taskStatus !== "pending" &&
    taskStatus !== "running";
  const canPublish = taskStatus === "succeeded" && !!videoUrl;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="text-primary h-6 w-6" />
        <h1 className="text-2xl font-bold">AI 视频生成</h1>
      </div>

      <div className="space-y-6">
        {/* 生成配置 */}
        <Card>
          <CardHeader>
            <CardTitle>生成配置</CardTitle>
            <CardDescription>
              输入提示词，配置参数，生成 AI 视频
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 提示词 */}
            <div className="space-y-2">
              <Label htmlFor="prompt">提示词 *</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的视频内容，例如：一只可爱的小猫在花园里玩耍"
                rows={4}
                disabled={taskStatus === "pending" || taskStatus === "running"}
              />
            </div>

            {/* 时长 */}
            <div className="space-y-2">
              <Label htmlFor="duration">时长</Label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(value === "5" ? 5 : 10)}
                disabled={taskStatus === "pending" || taskStatus === "running"}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 秒</SelectItem>
                  <SelectItem value="10">10 秒</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 高级选项 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="prompt-extend">提示词扩展</Label>
                  <p className="text-muted-foreground text-sm">
                    自动优化和扩展提示词
                  </p>
                </div>
                <Switch
                  id="prompt-extend"
                  checked={promptExtend}
                  onCheckedChange={setPromptExtend}
                  disabled={
                    taskStatus === "pending" || taskStatus === "running"
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audio">音频</Label>
                  <p className="text-muted-foreground text-sm">
                    为视频添加音频
                  </p>
                </div>
                <Switch
                  id="audio"
                  checked={audio}
                  onCheckedChange={setAudio}
                  disabled={
                    taskStatus === "pending" || taskStatus === "running"
                  }
                />
              </div>
            </div>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full"
              size="lg"
            >
              {taskStatus === "pending" || taskStatus === "running" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 生成状态 - 只显示错误信息 */}
        {error && (
          <Card>
            <CardHeader>
              <CardTitle>生成状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 生成结果 */}
        {taskStatus === "succeeded" && videoUrl && (
          <Card>
            <CardHeader>
              <CardTitle>生成结果</CardTitle>
              <CardDescription>视频生成成功，可以预览和发布</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 视频预览 */}
              <div className="space-y-2">
                <Label>视频预览</Label>
                <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg">
                  <video
                    src={videoUrl}
                    controls
                    className="h-full w-full"
                    preload="metadata"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(videoUrl, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载视频
                </Button>

                <Button onClick={handlePublish} disabled={!canPublish}>
                  <Play className="mr-2 h-4 w-4" />
                  发布视频
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

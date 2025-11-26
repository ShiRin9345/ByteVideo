"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
  RefreshCw,
  Tags,
} from "lucide-react";
import {
  createVideoTask,
  pollTaskResult,
  RESOLUTION_OPTIONS,
  generateVideoTags,
  type VideoGenerateRequest,
  type GenerationResult,
  type TaskStatusResponse,
  type VideoTagResponse,
} from "@/features/ai";

export default function CreatePage() {
  // 表单状态
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [resolutionTier, setResolutionTier] = useState<
    "480P" | "720P" | "1080P"
  >("720P");
  const [size, setSize] = useState("1280*720");
  const [promptExtend, setPromptExtend] = useState(true);
  const [audio, setAudio] = useState(true);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(
    null,
  );
  const [generationHistory, setGenerationHistory] = useState<
    GenerationResult[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isTagging, setIsTagging] = useState(false);
  const [videoTags, setVideoTags] = useState<string[]>([]);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagRawResponse, setTagRawResponse] = useState("");

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 根据分辨率档位更新size选项
  useEffect(() => {
    const options = RESOLUTION_OPTIONS[resolutionTier];
    if (options && options.length > 0) {
      setSize(options[0]?.value || "");
    }
  }, [resolutionTier]);

  // 清理轮询
  useEffect(() => {
    const currentPolling = pollingRef.current;
    return () => {
      if (currentPolling) {
        clearInterval(currentPolling);
      }
    };
  }, []);

  // 开始生成视频
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("请输入视频描述");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentResult(null);
    setVideoTags([]);
    setTagError(null);
    setTagRawResponse("");
    setTaskStatus("");

    try {
      const params: VideoGenerateRequest = {
        prompt: prompt.trim(),
        size,
        duration,
        prompt_extend: promptExtend,
        audio,
      };

      const response = await createVideoTask(params);
      const taskId = response.output.task_id;

      setTaskStatus(response.output.task_status);

      // 开始轮询
      startPolling(taskId, params);
    } catch (err: unknown) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "创建任务失败");
      setIsGenerating(false);
    }
  };

  // 轮询任务状态
  const startPolling = async (taskId: string, params: VideoGenerateRequest) => {
    try {
      const result = await pollTaskResult(taskId, {
        interval: 15000, // 15秒
        maxAttempts: 120, // 最多30分钟
        onProgress: (status: TaskStatusResponse) => {
          setTaskStatus(status.output.task_status);
        },
      });

      if (result.output.task_status === "SUCCEEDED") {
        const generationResult: GenerationResult = {
          taskId,
          status: result.output.task_status,
          videoUrl: result.output.video_url,
          actualPrompt: result.output.actual_prompt,
          origPrompt: result.output.orig_prompt,
          submitTime: result.output.submit_time,
          endTime: result.output.end_time,
          parameters: params,
        };

        setCurrentResult(generationResult);
        setVideoTags([]);
        setTagError(null);
        setTagRawResponse("");
        setGenerationHistory((prev) => [generationResult, ...prev].slice(0, 5)); // 最多保存5个
        setError(null);
      } else {
        setError(
          result.output.task_status === "FAILED"
            ? "视频生成失败，请重试"
            : "任务已取消",
        );
      }
    } catch (err: unknown) {
      console.error("Error polling task:", err);
      setError(err instanceof Error ? err.message : "查询任务状态失败");
    } finally {
      setIsGenerating(false);
    }
  };

  // 基于当前结果优化
  const handleOptimize = () => {
    if (!currentResult) return;

    setPrompt(currentResult.origPrompt || prompt);
    setDuration(currentResult.parameters.duration || 5);
    setSize(currentResult.parameters.size || "1280*720");
    setPromptExtend(currentResult.parameters.prompt_extend ?? true);
    setAudio(currentResult.parameters.audio ?? true);
  };

  // 下载视频
  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSelectHistoryResult = (result: GenerationResult) => {
    setCurrentResult(result);
    setVideoTags([]);
    setTagError(null);
    setTagRawResponse("");
  };

  const handleGenerateTags = async () => {
    if (!currentResult?.videoUrl || isTagging) return;

    try {
      setIsTagging(true);
      setTagError(null);

      const response = await generateVideoTags({
        videoUrl: currentResult.videoUrl,
        prompt: prompt.trim() || currentResult.parameters.prompt || "",
        actualPrompt: currentResult.actualPrompt || currentResult.origPrompt,
      });

      handleTagSuccess(response);
    } catch (err: unknown) {
      console.error("Error generating tags:", err);
      setTagError(err instanceof Error ? err.message : "生成视频标签失败");
    } finally {
      setIsTagging(false);
    }
  };

  const handleTagSuccess = (data: VideoTagResponse) => {
    setVideoTags(data.tags || []);
    setTagRawResponse(data.raw || "");
  };

  const currentResolutionOptions = RESOLUTION_OPTIONS[resolutionTier] || [];

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 md:mb-8">
          <div className="mb-2 flex items-center gap-4">
            <Link
              href="/explore"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              AIGC视频创作
            </h1>
          </div>
          <p className="text-muted-foreground mt-2 ml-9 text-sm md:text-base">
            输入文字描述，生成5-10秒短视频
          </p>
        </div>

        {error && (
          <Card className="border-destructive mb-6">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 左侧：参数配置 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>视频参数</CardTitle>
                <CardDescription>配置视频生成参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 文字描述 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    视频描述 <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="描述你想要的视频内容..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="text-muted-foreground text-right text-xs">
                    {prompt.length}/2000
                  </div>
                </div>

                {/* 视频时长 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">视频时长</label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) =>
                      setDuration(parseInt(value) as 5 | 10)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5秒</SelectItem>
                      <SelectItem value="10">10秒</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 分辨率档位 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">分辨率档位</label>
                  <Select
                    value={resolutionTier}
                    onValueChange={(value) =>
                      setResolutionTier(value as "480P" | "720P" | "1080P")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480P">480P</SelectItem>
                      <SelectItem value="720P">720P</SelectItem>
                      <SelectItem value="1080P">1080P</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 具体分辨率 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">具体分辨率</label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentResolutionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 高级选项 */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">
                        智能改写Prompt
                      </label>
                      <p className="text-muted-foreground text-xs">
                        使用AI优化提示词，提升生成效果
                      </p>
                    </div>
                    <Switch
                      checked={promptExtend}
                      onCheckedChange={setPromptExtend}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">自动配音</label>
                      <p className="text-muted-foreground text-xs">
                        为视频自动生成音频
                      </p>
                    </div>
                    <Switch checked={audio} onCheckedChange={setAudio} />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        开始生成
                      </>
                    )}
                  </Button>
                  {currentResult && (
                    <Button
                      variant="outline"
                      onClick={handleOptimize}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="h-4 w-4" />
                      优化
                    </Button>
                  )}
                </div>

                {/* 任务状态 */}
                {isGenerating && taskStatus && (
                  <div className="border-t pt-4">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        状态:{" "}
                        {taskStatus === "PENDING"
                          ? "排队中"
                          : taskStatus === "RUNNING"
                            ? "生成中"
                            : taskStatus}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：预览和结果 */}
          <div className="space-y-6">
            {/* 当前结果 */}
            {currentResult && (
              <Card>
                <CardHeader>
                  <CardTitle>生成结果</CardTitle>
                  <CardDescription>最新生成的视频</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentResult.videoUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                      <video
                        src={currentResult.videoUrl}
                        controls
                        className="h-full w-full"
                      />
                    </div>
                  )}
                  {currentResult.actualPrompt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        实际使用的Prompt
                      </label>
                      <div className="bg-muted rounded-md p-3 text-sm">
                        {currentResult.actualPrompt}
                      </div>
                    </div>
                  )}
                  {currentResult.videoUrl && (
                    <div className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Tags className="h-4 w-4" />
                          智能标签
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGenerateTags}
                          disabled={isTagging}
                        >
                          {isTagging ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            "生成标签"
                          )}
                        </Button>
                      </div>
                      {tagError && (
                        <p className="text-destructive text-sm">{tagError}</p>
                      )}
                      {!tagError && videoTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {videoTags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {tagRawResponse && videoTags.length === 0 && (
                        <p className="text-muted-foreground text-xs break-words">
                          {tagRawResponse}
                        </p>
                      )}
                      {!videoTags.length && !tagError && !isTagging && (
                        <p className="text-muted-foreground text-xs">
                          点击「生成标签」即可基于视频自动输出推荐标签
                        </p>
                      )}
                    </div>
                  )}
                  {currentResult.videoUrl && (
                    <Button
                      onClick={() => handleDownload(currentResult!.videoUrl!)}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4" />
                      下载视频
                    </Button>
                  )}
                  <p className="text-muted-foreground text-xs">
                    注意：视频链接有效期24小时，请及时下载
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 生成历史 */}
            {generationHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>生成历史</CardTitle>
                  <CardDescription>最近生成的视频（最多5个）</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generationHistory.map((result, index) => (
                    <div
                      key={result.taskId}
                      className="space-y-2 rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          结果 #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectHistoryResult(result)}
                        >
                          查看
                        </Button>
                      </div>
                      {result.videoUrl && (
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                          <video
                            src={result.videoUrl}
                            controls
                            className="h-full w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 空状态 */}
            {!currentResult && !isGenerating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="text-muted-foreground mb-4 h-12 w-12" />
                    <p className="text-muted-foreground">
                      填写参数后点击&ldquo;开始生成&rdquo;创建视频
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

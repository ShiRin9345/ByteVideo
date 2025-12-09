import type {
  VideoGenerateRequest,
  VideoGenerateResponse,
  TaskStatusResponse,
} from "../types";

// 创建视频生成任务
export async function createVideoTask(
  params: VideoGenerateRequest,
): Promise<VideoGenerateResponse> {
  const response = await fetch("/api/ai/videoTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create video generation task");
  }

  return response.json();
}

// 查询任务状态
export async function checkTaskStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  const response = await fetch(`/api/ai/status/${taskId}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check task status");
  }

  return response.json();
}

// 轮询获取结果
export async function pollTaskResult(
  taskId: string,
  options: {
    interval?: number;
    maxAttempts?: number;
    onProgress?: (status: TaskStatusResponse) => void;
  } = {},
): Promise<TaskStatusResponse> {
  const { interval = 15000, maxAttempts = 120, onProgress } = options; // 默认15秒间隔，最多30分钟

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = await checkTaskStatus(taskId);

      if (onProgress) {
        onProgress(result);
      }

      if (
        result.output.task_status === "SUCCEEDED" ||
        result.output.task_status === "FAILED" ||
        result.output.task_status === "CANCELED"
      ) {
        return result;
      }

      // 等待指定间隔后再次查询
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      console.error("Error polling task status:", error);
      attempts++;

      // 如果是网络错误，继续重试
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      } else {
        throw error;
      }
    }
  }

  throw new Error(
    "Polling timeout: Task did not complete within the maximum attempts",
  );
}

// 分辨率选项配置
export const RESOLUTION_OPTIONS = {
  "480P": [
    { value: "832*480", label: "832×480 (16:9)" },
    { value: "480*832", label: "480×832 (9:16)" },
    { value: "624*624", label: "624×624 (1:1)" },
  ],
  "720P": [
    { value: "1280*720", label: "1280×720 (16:9)" },
    { value: "720*1280", label: "720×1280 (9:16)" },
    { value: "960*960", label: "960×960 (1:1)" },
    { value: "1088*832", label: "1088×832 (4:3)" },
    { value: "832*1088", label: "832×1088 (3:4)" },
  ],
  "1080P": [
    { value: "1920*1080", label: "1920×1080 (16:9)" },
    { value: "1080*1920", label: "1080×1920 (9:16)" },
    { value: "1440*1440", label: "1440×1440 (1:1)" },
    { value: "1632*1248", label: "1632×1248 (4:3)" },
    { value: "1248*1632", label: "1248×1632 (3:4)" },
  ],
};

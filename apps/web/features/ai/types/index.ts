import OpenAI from "openai";

// DashScope API 扩展类型（支持 video_url）
export type DashScopeContentPart =
  | OpenAI.Chat.Completions.ChatCompletionContentPart
  | { type: "video_url"; video_url: { url: string } };

// 视频生成相关类型
export type VideoGenerateRequest = {
  prompt: string;
  size?: string;
  duration?: 5 | 10;
  prompt_extend?: boolean;
  audio?: boolean;
};

export type VideoGenerateResponse = {
  output: {
    task_status: string;
    task_id: string;
  };
  request_id: string;
  code?: string;
  message?: string;
};

export type TaskStatusResponse = {
  request_id: string;
  output: {
    task_id: string;
    task_status:
      | "PENDING"
      | "RUNNING"
      | "SUCCEEDED"
      | "FAILED"
      | "CANCELED"
      | "UNKNOWN";
    submit_time?: string;
    scheduled_time?: string;
    end_time?: string;
    orig_prompt?: string;
    actual_prompt?: string;
    video_url?: string;
  };
  usage?: {
    video_duration: number;
    video_ratio: string;
    video_count: number;
  };
  code?: string;
  message?: string;
};

export type GenerationResult = {
  taskId: string;
  status: string;
  videoUrl?: string;
  actualPrompt?: string;
  origPrompt?: string;
  submitTime?: string;
  endTime?: string;
  parameters: VideoGenerateRequest;
};

export type VideoTagRequest = {
  videoUrl: string;
  prompt?: string;
  actualPrompt?: string;
};

export type VideoTagResponse = {
  tags: string[];
  raw: string;
};

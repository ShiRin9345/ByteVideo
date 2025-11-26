import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { DashScopeContentPart } from "@/features/ai/types";
import { extractTagsFromText } from "@/features/ai/utils/extractTagsFromText";
import { systemPrompt } from "@/features/ai/data/prompt";
import { instructions } from "@/features/ai/data/instructions";

export async function POST(request: NextRequest) {
  const { videoUrl, prompt, actualPrompt } = await request.json();

  if (!videoUrl) {
    return NextResponse.json(
      { error: "videoUrl is required" },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: process.env.DASHSCOPE_BASE_URL,
    });

    // 构建用户提示词
    const referencePrompt = actualPrompt || prompt;
    const userPromptParts = [
      instructions.join("；"),
      "/no_think",
      referencePrompt ? `提示词参考：${referencePrompt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // 构建内容数组
    const contentParts = [
      {
        type: "video_url",
        video_url: { url: videoUrl },
      },
      {
        type: "text",
        text: userPromptParts,
      },
    ] as DashScopeContentPart[] as unknown as OpenAI.Chat.Completions.ChatCompletionContentPart[];

    // 调用 API
    const completion = await client.chat.completions.create({
      model: "qwen3-vl-plus",
      temperature: 0,
      top_p: 0.01,
      max_tokens: 512,
      messages: [
        { role: "system", content: [{ type: "text", text: systemPrompt }] },
        { role: "user", content: contentParts },
      ],
    });

    // 响应解析
    const content = completion.choices[0]?.message?.content || "";
    const tags = extractTagsFromText(content);

    return NextResponse.json({ tags, raw: content });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate tags" },
      { status: 500 },
    );
  }
}

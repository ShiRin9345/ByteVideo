import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  const { prompt, size, duration, prompt_extend, audio } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${process.env.DASHSCOPE_BASE_URL}/services/aigc/video-generation/video-synthesis`,
      {
        model: "wan2.5-t2v-preview",
        input: {
          prompt,
        },
        parameters: {
          size,
          duration,
          prompt_extend,
          audio,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "X-DashScope-Async": "enable",
        },
      },
    );

    return NextResponse.json(response.data);
  } catch {
    return NextResponse.json(
      { error: "Failed to create video generation task" },
      { status: 500 },
    );
  }
}

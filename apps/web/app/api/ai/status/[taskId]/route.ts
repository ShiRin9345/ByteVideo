import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    // 清理环境变量值（去除引号、分号等）
    const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL?.trim().replace(
      /^["']|["'];?$/g,
      "",
    );
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY?.trim().replace(
      /^["']|["'];?$/g,
      "",
    );

    if (!DASHSCOPE_BASE_URL || !DASHSCOPE_API_KEY) {
      console.error("Missing environment variables:", {
        DASHSCOPE_BASE_URL: !!DASHSCOPE_BASE_URL,
        DASHSCOPE_API_KEY: !!DASHSCOPE_API_KEY,
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const response = await axios.get(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error checking task status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorResponse =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : null;

    return NextResponse.json(
      {
        error: "Failed to check task status",
        message: errorMessage,
        details: errorResponse,
      },
      { status: 500 },
    );
  }
}

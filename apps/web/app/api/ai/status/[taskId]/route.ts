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
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
    const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL;
    const response = await axios.get(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });
    return NextResponse.json(response.data);
  } catch {
    return NextResponse.json(
      { error: "Failed to check task status" },
      { status: 500 },
    );
  }
}

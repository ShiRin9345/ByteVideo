import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { video } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";

export interface LikeVideoResponse {
  success: boolean;
  data?: {
    id: string;
    likes: number;
  };
  error?: string;
}

export const POST = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const { id } = await params;

      // 验证视频是否存在
      const videoData = await db
        .select({ id: video.id, likes: video.likes })
        .from(video)
        .where(eq(video.id, id))
        .limit(1);

      if (!videoData || videoData.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Video not found",
          },
          { status: 404 },
        );
      }

      const currentLikes = videoData[0]!.likes;

      // 增加点赞数
      const updatedVideo = await db
        .update(video)
        .set({
          likes: currentLikes + 1,
          updatedAt: new Date(),
        })
        .where(eq(video.id, id))
        .returning({ id: video.id, likes: video.likes });

      const response: LikeVideoResponse = {
        success: true,
        data: {
          id: updatedVideo[0]!.id,
          likes: updatedVideo[0]!.likes,
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Like video error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
);

import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { video, user } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";

export interface VideoDetailResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    theme: string[];
    description: string | null;
    tags: string[] | null;
    videoId: string;
    coverUrl: string | null;
    coverWidth: number | null; // 封面图宽度
    coverHeight: number | null; // 封面图高度
    views: number;
    likes: number;
    comments: number;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string;
      username: string;
      image: string | null;
    };
  };
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 查询视频信息，同时关联用户信息
    const videoData = await db
      .select({
        video: video,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        },
      })
      .from(video)
      .innerJoin(user, eq(video.userId, user.id))
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

    const { video: videoRecord, user: author } = videoData[0]!;

    // 增加播放量
    await db
      .update(video)
      .set({ views: videoRecord.views + 1 })
      .where(eq(video.id, id));

    const response: VideoDetailResponse = {
      success: true,
      data: {
        id: videoRecord.id,
        name: videoRecord.name,
        theme: videoRecord.theme,
        description: videoRecord.description,
        tags: videoRecord.tags,
        videoId: videoRecord.videoId,
        coverUrl: videoRecord.coverUrl,
        coverWidth: videoRecord.coverWidth ?? null,
        coverHeight: videoRecord.coverHeight ?? null,
        views: videoRecord.views + 1, // 返回更新后的播放量
        likes: videoRecord.likes,
        comments: videoRecord.comments,
        createdAt: videoRecord.createdAt,
        updatedAt: videoRecord.updatedAt,
        author: {
          id: author.id,
          name: author.name,
          username: author.username,
          image: author.image,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get video detail error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

interface UpdateVideoRequest {
  name?: string;
  theme?: string[];
}

export const PUT = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      if (!req.user) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
          },
          { status: 401 },
        );
      }

      const { id } = await params;
      const body: UpdateVideoRequest = await req.json();
      const { name, theme } = body;

      // 验证至少提供一个要更新的字段
      if (!name && !theme) {
        return NextResponse.json(
          {
            success: false,
            error: "At least one field (name or theme) is required",
          },
          { status: 400 },
        );
      }

      // 验证 theme 如果是数组，必须非空
      if (theme !== undefined) {
        if (!Array.isArray(theme) || theme.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Theme must be a non-empty array",
            },
            { status: 400 },
          );
        }
      }

      // 检查视频是否存在且属于当前用户
      const existingVideo = await db
        .select()
        .from(video)
        .where(and(eq(video.id, id), eq(video.userId, req.user.userId)))
        .limit(1);

      if (!existingVideo || existingVideo.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Video not found or you don't have permission to edit it",
          },
          { status: 404 },
        );
      }

      // 构建更新对象
      const updateData: {
        name?: string;
        theme?: string[];
        updatedAt?: Date;
      } = {
        updatedAt: new Date(),
      };

      if (name !== undefined) {
        updateData.name = name.trim();
      }

      if (theme !== undefined) {
        updateData.theme = theme;
      }

      // 更新视频
      const updatedVideo = await db
        .update(video)
        .set(updateData)
        .where(eq(video.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        data: {
          id: updatedVideo[0]?.id,
          name: updatedVideo[0]?.name,
          theme: updatedVideo[0]?.theme,
        },
      });
    } catch (error) {
      console.error("Update video error:", error);
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

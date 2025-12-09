import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { commentTable, user, video } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";
import { randomUUID } from "crypto";

export interface CommentItem {
  id: string;
  content: string;
  likes: number;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}

export interface CommentListResponse {
  success: boolean;
  data?: CommentItem[];
  error?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateCommentResponse {
  success: boolean;
  data?: {
    id: string;
    content: string;
    likes: number;
    createdAt: Date;
    videoComments: number; // 更新后的视频评论总数
  };
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 验证视频是否存在
    const videoExists = await db
      .select({ id: video.id })
      .from(video)
      .where(eq(video.id, id))
      .limit(1);

    if (!videoExists || videoExists.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
        },
        { status: 404 },
      );
    }

    // 查询评论列表，关联用户信息，按创建时间倒序
    const comments = await db
      .select({
        id: commentTable.id,
        content: commentTable.content,
        likes: commentTable.likes,
        createdAt: commentTable.createdAt,
        author: {
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        },
      })
      .from(commentTable)
      .innerJoin(user, eq(commentTable.userId, user.id))
      .where(eq(commentTable.videoId, id))
      .orderBy(desc(commentTable.createdAt));

    const response: CommentListResponse = {
      success: true,
      data: comments,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const { id } = await params;
      const body: CreateCommentRequest = await req.json();
      const { content } = body;

      // 验证输入
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Comment content is required",
          },
          { status: 400 },
        );
      }

      // 验证视频是否存在
      const videoData = await db
        .select({ id: video.id, comments: video.comments })
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

      const currentComments = videoData[0]!.comments;

      // withAuth 确保 req.user 存在
      if (!req.user) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
          },
          { status: 401 },
        );
      }

      // 创建评论
      const newComment = await db
        .insert(commentTable)
        .values({
          id: randomUUID(),
          userId: req.user.userId,
          videoId: id,
          content: content.trim(),
          likes: 0,
        })
        .returning();

      // 更新视频的评论数
      const updatedVideo = await db
        .update(video)
        .set({
          comments: currentComments + 1,
          updatedAt: new Date(),
        })
        .where(eq(video.id, id))
        .returning({ comments: video.comments });

      const response: CreateCommentResponse = {
        success: true,
        data: {
          id: newComment[0]!.id,
          content: newComment[0]!.content,
          likes: newComment[0]!.likes,
          createdAt: newComment[0]!.createdAt,
          videoComments: updatedVideo[0]!.comments,
        },
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error("Create comment error:", error);
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

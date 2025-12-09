import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { video } from "@workspace/db/schema";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";
import { randomUUID } from "crypto";

/**
 * OSS 图片信息响应格式
 */
interface OSSImageInfoResponse {
  FileSize?: {
    value: string;
  };
  Format?: {
    value: string;
  };
  FrameCount?: {
    value: string;
  };
  ImageHeight?: {
    value: string;
  };
  ImageWidth?: {
    value: string;
  };
}

/**
 * 获取图片基本信息（宽度、高度、大小）
 * 通过 OSS 的 x-oss-process=image/info 查询参数获取图片信息
 * @param imageUrl 图片URL
 * @returns 图片信息 { width, height, size } 或 null
 */
async function getImageInfo(
  imageUrl: string,
): Promise<{ width: number; height: number; size?: number } | null> {
  try {
    // 构建带查询参数的 URL
    const separator = imageUrl.includes("?") ? "&" : "?";
    const infoUrl = `${imageUrl}${separator}x-oss-process=image/info`;

    const response = await fetch(infoUrl);
    if (!response.ok) {
      console.warn(
        `Failed to get image info for ${imageUrl}: ${response.statusText}`,
      );
      return null;
    }

    const data: OSSImageInfoResponse = await response.json();

    const width = data.ImageWidth?.value
      ? Number.parseInt(data.ImageWidth.value, 10)
      : null;
    const height = data.ImageHeight?.value
      ? Number.parseInt(data.ImageHeight.value, 10)
      : null;
    const size = data.FileSize?.value
      ? Number.parseInt(data.FileSize.value, 10)
      : undefined;

    if (width && height) {
      return {
        width,
        height,
        size,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting image info for ${imageUrl}:`, error);
    return null;
  }
}

interface PublishVideoRequest {
  videoId: string; // 视频ID（来自阿里云VOD）
  name: string; // 视频名称
  theme: string[]; // 主题数组
  description: string; // 描述
  tags: string[]; // 标签数组
  coverUrl: string; // 封面图URL
}

export const POST = withAuth(async (req: AuthenticatedRequest, { params }) => {
  await params; // Next.js 15 要求
  try {
    if (!req.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User not authenticated",
        },
        { status: 401 },
      );
    }

    const body: PublishVideoRequest = await req.json();
    const { videoId, name, theme, description, tags, coverUrl } = body;

    // 验证必填字段
    if (
      !videoId ||
      !name ||
      !theme ||
      !Array.isArray(theme) ||
      theme.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "videoId, name, and theme (non-empty array) are required",
        },
        { status: 400 },
      );
    }

    // 获取封面图信息（宽度和高度）
    let coverWidth: number | undefined;
    let coverHeight: number | undefined;
    if (coverUrl) {
      const imageInfo = await getImageInfo(coverUrl);
      if (imageInfo) {
        coverWidth = imageInfo.width;
        coverHeight = imageInfo.height;
      }
    }

    // 创建视频记录
    const newVideo = await db
      .insert(video)
      .values({
        id: randomUUID(),
        videoId,
        name: name.trim(),
        theme,
        description: description.trim(),
        tags,
        coverUrl,
        coverWidth,
        coverHeight,
        userId: req.user.userId,
        views: 0,
        likes: 0,
        comments: 0,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newVideo[0]?.id,
          videoId: newVideo[0]?.videoId,
          name: newVideo[0]?.name,
          theme: newVideo[0]?.theme,
          description: newVideo[0]?.description,
          tags: newVideo[0]?.tags,
          coverUrl: newVideo[0]?.coverUrl,
          createdAt: newVideo[0]?.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Publish video error:", error);

    // 处理数据库约束错误
    if (error instanceof Error) {
      // 检查是否是唯一约束冲突
      if (
        error.message.includes("unique") ||
        error.message.includes("duplicate")
      ) {
        return NextResponse.json(
          {
            error: "Duplicate video",
            message: "A video with this ID already exists",
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to publish video",
      },
      { status: 500 },
    );
  }
});

import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { video } from "@workspace/db/schema";
import { and, desc, asc, ilike, sql, gt } from "drizzle-orm";

// 视频数据接口
export interface VideoItem {
  id: string;
  name: string;
  theme: string[]; // 主题数组
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
}

// API 响应接口（使用 cursor 分页）
export interface VideoListResponse {
  success: boolean;
  data: {
    items: VideoItem[];
    nextCursor: string | null;
  };
  error?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 获取查询参数
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const name = searchParams.get("name") || undefined; // 名称模糊搜索
    const theme = searchParams.get("theme") || undefined; // 主题筛选
    const sortBy = searchParams.get("sortBy") || "createdAt"; // 排序字段
    const sortOrder = searchParams.get("sortOrder") || "desc"; // 排序方向

    // 验证 limit
    const pageSize = Math.min(Math.max(limit, 1), 100); // 限制在 1-100 之间

    // 构建查询条件
    const conditions = [];

    // 名称模糊筛选
    if (name) {
      conditions.push(ilike(video.name, `%${name}%`));
    }

    // 主题筛选：检查 theme 数组是否包含指定主题
    if (theme) {
      // 使用 PostgreSQL 数组操作符 @> 检查数组是否包含元素
      conditions.push(sql`${video.theme} @> ARRAY[${theme}]::text[]`);
    }

    // Cursor 分页：如果提供了 cursor，查询 id > cursor 的记录
    if (cursor) {
      conditions.push(gt(video.id, cursor));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 构建排序
    let orderBy;
    switch (sortBy) {
      case "views":
        orderBy = sortOrder === "asc" ? asc(video.views) : desc(video.views);
        break;
      case "likes":
        orderBy = sortOrder === "asc" ? asc(video.likes) : desc(video.likes);
        break;
      case "createdAt":
      default:
        orderBy =
          sortOrder === "asc" ? asc(video.createdAt) : desc(video.createdAt);
        break;
    }

    // 查询数据（多查询一条以判断是否有下一页）
    const videos = await db
      .select()
      .from(video)
      .where(whereClause)
      .orderBy(orderBy, asc(video.id)) // 添加 id 作为次要排序，确保结果稳定
      .limit(pageSize + 1); // 多查询一条

    // 判断是否有下一页
    const hasNextPage = videos.length > pageSize;
    const items = hasNextPage ? videos.slice(0, pageSize) : videos;

    // 生成 nextCursor（使用最后一条记录的 id）
    const nextCursor =
      hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

    // 转换数据格式
    const videoItems: VideoItem[] = items.map((v) => ({
      id: v.id,
      name: v.name,
      theme: v.theme,
      description: v.description,
      tags: v.tags,
      videoId: v.videoId,
      coverUrl: v.coverUrl,
      coverWidth: v.coverWidth ?? null,
      coverHeight: v.coverHeight ?? null,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    const response: VideoListResponse = {
      success: true,
      data: {
        items: videoItems,
        nextCursor,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Video list API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

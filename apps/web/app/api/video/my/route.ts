import { NextResponse } from "next/server";
import { db } from "@workspace/db/client";
import { video } from "@workspace/db/schema";
import { withAuth, AuthenticatedRequest } from "@/features/auth/lib/middleware";
import { and, desc, asc, ilike, sql, eq } from "drizzle-orm";

// 视频数据接口（用于管理页面）
export interface MyVideoItem {
  id: string;
  name: string;
  theme: string[]; // 主题数组
  views: number;
  likes: number;
  publishTime: string; // ISO 字符串格式的创建时间
}

// API 响应接口
export interface MyVideoListResponse {
  success: boolean;
  data: {
    items: MyVideoItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

export const GET = withAuth(async (req: AuthenticatedRequest, { params }) => {
  await params; // Next.js 15 要求
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

    const { searchParams } = new URL(req.url);

    // 获取查询参数
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || undefined; // 名称模糊搜索
    const theme = searchParams.get("theme") || undefined; // 主题筛选
    const sortBy = searchParams.get("sortBy") || "publishTime"; // 排序字段
    const sortOrder = searchParams.get("sortOrder") || "desc"; // 排序方向

    // 验证分页参数
    const pageNum = Math.max(1, page);
    const pageSizeNum = Math.min(Math.max(pageSize, 1), 100);

    // 构建查询条件 - 必须包含当前用户的 userId
    const conditions = [eq(video.userId, req.user.userId)];

    // 名称模糊筛选
    if (search) {
      conditions.push(ilike(video.name, `%${search}%`));
    }

    // 主题筛选：检查 theme 数组是否包含指定主题
    if (theme) {
      // 使用 PostgreSQL 数组操作符 @> 检查数组是否包含元素
      conditions.push(sql`${video.theme} @> ARRAY[${theme}]::text[]`);
    }

    const whereClause = and(...conditions);

    // 构建排序
    let orderBy;
    switch (sortBy) {
      case "views":
        orderBy = sortOrder === "asc" ? asc(video.views) : desc(video.views);
        break;
      case "likes":
        orderBy = sortOrder === "asc" ? asc(video.likes) : desc(video.likes);
        break;
      case "publishTime":
      case "createdAt":
      default:
        orderBy =
          sortOrder === "asc" ? asc(video.createdAt) : desc(video.createdAt);
        break;
    }

    // 先获取总数
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(video)
      .where(whereClause);
    const total = Number(totalCountResult[0]?.count || 0);

    // 计算偏移量
    const offset = (pageNum - 1) * pageSizeNum;

    // 查询数据
    const videos = await db
      .select()
      .from(video)
      .where(whereClause)
      .orderBy(orderBy, asc(video.id)) // 添加 id 作为次要排序，确保结果稳定
      .limit(pageSizeNum)
      .offset(offset);

    // 转换数据格式
    const videoItems: MyVideoItem[] = videos.map((v) => ({
      id: v.id,
      name: v.name,
      theme: v.theme,
      views: v.views,
      likes: v.likes,
      publishTime: v.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / pageSizeNum);

    const response: MyVideoListResponse = {
      success: true,
      data: {
        items: videoItems,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("My video list API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});

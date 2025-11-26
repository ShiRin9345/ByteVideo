import { NextResponse } from "next/server";

// 视频数据接口
export interface VideoItem {
  id: string;
  name: string;
  theme: string;
  views: number;
  likes: number;
  publishTime: string;
}

// API 响应接口
export interface VideoListResponse {
  success: boolean;
  data: {
    items: VideoItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

const themes = ["生活", "美食", "旅行", "科技", "娱乐"] as const;

// 使用固定算法生成视频数据，确保服务器和客户端一致
function generateMockVideos(
  count: number,
  startIndex = 0,
  filters?: { search?: string; theme?: string },
): VideoItem[] {
  const baseDate = new Date("2024-01-01").getTime();
  const dayInMs = 24 * 60 * 60 * 1000;

  const allVideos: VideoItem[] = Array.from({ length: 100 }, (_, i) => {
    const viewsSeed = (i * 1000 + 12345) % 100000;
    const likesSeed = (i * 500 + 54321) % 10000;
    const dateSeed = (i * 7 + 98765) % 30;

    // 生成视频名称
    const nameTemplates = [
      "精彩视频",
      "生活分享",
      "美食探索",
      "旅行日记",
      "科技前沿",
      "娱乐时光",
      "日常记录",
      "美好瞬间",
    ];
    const nameIndex = i % nameTemplates.length;
    const name = `${nameTemplates[nameIndex]} ${i + 1}`;

    return {
      id: `video-${i + 1}`,
      name,
      theme: themes[i % 5]!,
      views: Math.floor(viewsSeed * 0.8 + 10000),
      likes: Math.floor(likesSeed * 0.8 + 1000),
      publishTime: new Date(baseDate + dateSeed * dayInMs)
        .toISOString()
        .split("T")[0]!,
    };
  });

  // 应用筛选
  let filteredVideos = allVideos;
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredVideos = filteredVideos.filter((video) =>
      video.name.toLowerCase().includes(searchLower),
    );
  }
  if (filters?.theme) {
    filteredVideos = filteredVideos.filter(
      (video) => video.theme === filters.theme,
    );
  }

  // 返回分页数据
  return filteredVideos.slice(startIndex, startIndex + count);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const theme = searchParams.get("theme") || undefined;
    const sortBy = searchParams.get("sortBy") || "publishTime";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 生成所有数据（应用筛选）
    const allVideos = generateMockVideos(100, 0, { search, theme });

    // 排序
    const sortedVideos = [...allVideos].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "views":
          aValue = a.views;
          bValue = b.views;
          break;
        case "likes":
          aValue = a.likes;
          bValue = b.likes;
          break;
        case "publishTime":
          aValue = a.publishTime;
          bValue = b.publishTime;
          break;
        default:
          aValue = a.publishTime;
          bValue = b.publishTime;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    // 分页
    const startIndex = (page - 1) * pageSize;
    const items = sortedVideos.slice(startIndex, startIndex + pageSize);
    const total = sortedVideos.length;
    const totalPages = Math.ceil(total / pageSize);

    const response: VideoListResponse = {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

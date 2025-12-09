import { Suspense } from "react";
import { getVideoList } from "@/features/video/api/my-video-list";
import { VideoTable } from "./components/VideoTable";
import { TableSkeleton } from "@/components/skeleton/table-skeleton";
import { ToolbarSkeleton } from "@/components/skeleton/toolbar-skeleton";
import { PaginationSkeleton } from "@/components/skeleton/pagination-skeleton";

interface ManagePageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    name?: string;
    theme?: string;
    sort?: string;
  }>;
}

export default async function ManagePage({ searchParams }: ManagePageProps) {
  const params = await searchParams;

  // 解析查询参数
  const page = parseInt(params.page || "1", 10) || 1;
  const pageSize = parseInt(params.perPage || "10", 10) || 10;
  const search = params.name || null;
  const theme = params.theme || null;

  // 解析排序参数
  let sortBy: string | null = null;
  let sortOrder: "asc" | "desc" | null = null;
  if (params.sort) {
    try {
      const sortArray = JSON.parse(params.sort);
      if (Array.isArray(sortArray) && sortArray.length > 0) {
        sortBy = sortArray[0]?.id || null;
        sortOrder = sortArray[0]?.desc ? "desc" : "asc";
      }
    } catch {
      sortBy = "publishTime";
      sortOrder = "desc";
    }
  } else {
    sortBy = "publishTime";
    sortOrder = "desc";
  }

  // 在服务端获取数据
  const videoListData = await getVideoList({
    page,
    pageSize,
    search,
    theme,
    sortBy,
    sortOrder,
  });
  console.log(videoListData);
  if (!videoListData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex w-full flex-col gap-2.5">
          <ToolbarSkeleton />
          <TableSkeleton columnCount={6} rowCount={10} />
          <PaginationSkeleton />
        </div>
      }
    >
      <VideoTable initialData={videoListData} />
    </Suspense>
  );
}

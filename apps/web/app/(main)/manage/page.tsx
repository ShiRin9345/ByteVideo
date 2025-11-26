"use client";

import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Edit, Text } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table/data-table";
import { DataTableToolbar } from "@workspace/ui/components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table/data-table-column-header";
import { DataTableSortList } from "@workspace/ui/components/data-table/data-table-sort-list";
import { useDataTable } from "@workspace/ui/hooks/use-data-table";
import { getSortingStateParser } from "@workspace/ui/lib/parsers";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchVideoList, type VideoItem } from "@/features/ai/api/video-list";
import { parseAsString } from "nuqs";

const themes = ["生活", "美食", "旅行", "科技", "娱乐"] as const;

export default function ManagePage() {
  // 从 URL 查询参数读取分页和筛选条件
  const [page] = useQueryState("page", parseAsString.withDefault("1"));
  const [perPage] = useQueryState("perPage", parseAsString.withDefault("10"));
  const [nameFilter] = useQueryState("name", parseAsString);
  const [themeFilter] = useQueryState("theme", parseAsString);

  const pageNum = parseInt(page, 10) || 1;
  const pageSizeNum = parseInt(perPage, 10) || 10;

  // 定义列
  const columns = useMemo<ColumnDef<VideoItem>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="视频名称" />
        ),
        cell: (info) => (
          <span className="font-medium">{info.getValue() as string}</span>
        ),
        meta: {
          label: "视频名称",
          placeholder: "搜索视频名称...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "theme",
        accessorKey: "theme",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="主题" />
        ),
        cell: (info) => (
          <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
            {info.getValue() as string}
          </span>
        ),
        meta: {
          label: "主题",
          variant: "multiSelect",
          options: Array.from(themes).map((theme) => ({
            label: theme,
            value: theme,
          })),
        },
        enableColumnFilter: true,
      },
      {
        id: "views",
        accessorKey: "views",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="播放量" />
        ),
        cell: (info) => (info.getValue() as number).toLocaleString(),
        sortingFn: "basic",
      },
      {
        id: "likes",
        accessorKey: "likes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="点赞数" />
        ),
        cell: (info) => (info.getValue() as number).toLocaleString(),
        sortingFn: "basic",
      },
      {
        id: "publishTime",
        accessorKey: "publishTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="发布时间" />
        ),
        cell: (info) => info.getValue() as string,
        sortingFn: "datetime",
      },
      {
        id: "actions",
        header: "操作",
        cell: () => (
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            编辑
          </Button>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [],
  );

  const columnIds = useMemo(() => columns.map((col) => col.id!), [columns]);

  const [sorting] = useQueryState(
    "sort",
    getSortingStateParser<VideoItem>(columnIds).withDefault([
      { id: "publishTime", desc: true },
    ]),
  );

  const currentSort = sorting[0];
  const sortBy = currentSort?.id || "publishTime";
  const sortOrder: "asc" | "desc" = currentSort?.desc ? "desc" : "asc";

  const { data: videoListData } = useSuspenseQuery({
    queryKey: [
      "video-list",
      pageNum,
      pageSizeNum,
      nameFilter,
      themeFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchVideoList({
        page: pageNum,
        pageSize: pageSizeNum,
        search: nameFilter,
        theme: themeFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      }),
    refetchOnWindowFocus: false,
  });

  const videos = videoListData.data.items;
  const total = videoListData.data.total;

  const { table } = useDataTable({
    data: videos,
    columns,
    pageCount: Math.ceil(total / pageSizeNum),
    initialState: {
      sorting,
      pagination: { pageIndex: pageNum - 1, pageSize: pageSizeNum },
    },
    getRowId: (row) => row.id,
  });

  return (
    <>
      {videos.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground">没有找到相关视频</p>
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} />
          </DataTableToolbar>
        </DataTable>
      )}
    </>
  );
}

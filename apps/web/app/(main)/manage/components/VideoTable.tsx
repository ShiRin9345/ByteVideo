"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { parseAsString } from "nuqs";
import type { VideoItem } from "@/features/ai/api/video-list";
import { EditVideoDialog } from "./EditVideoDialog";

const themes = ["生活", "美食", "旅行", "科技", "娱乐"] as const;

interface VideoTableProps {
  initialData: {
    items: VideoItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function VideoTable({ initialData }: VideoTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从 URL 查询参数读取分页和筛选条件（用于同步 URL 状态）
  const [page] = useQueryState("page", parseAsString.withDefault("1"));
  const [perPage] = useQueryState("perPage", parseAsString.withDefault("10"));

  const pageNum = parseInt(page, 10) || 1;
  const pageSizeNum = parseInt(perPage, 10) || 10;

  // 跳过首次加载
  const isFirstMount = useRef(true);

  // 编辑对话框状态
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
        cell: (info) => {
          const themeArray = info.getValue() as string[];
          if (!Array.isArray(themeArray) || themeArray.length === 0) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {themeArray.map((theme, index) => (
                <span
                  key={index}
                  className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs"
                >
                  {theme}
                </span>
              ))}
            </div>
          );
        },
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
        cell: (info) => {
          const publishTime = info.getValue() as string;
          if (!publishTime) return "-";
          try {
            const date = new Date(publishTime);
            return date.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
          } catch {
            return publishTime;
          }
        },
        sortingFn: "datetime",
      },
      {
        id: "actions",
        header: "操作",
        cell: (info) => {
          const row = info.row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditingVideo(row);
                setIsEditDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
              编辑
            </Button>
          );
        },
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

  // 监听 URL 变化，刷新服务端数据
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    router.refresh();
  }, [searchParams, router]);

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount: initialData.totalPages,
    initialState: {
      sorting,
      pagination: { pageIndex: pageNum - 1, pageSize: pageSizeNum },
    },
    getRowId: (row) => row.id,
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
      <EditVideoDialog
        video={editingVideo}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          setEditingVideo(null);
        }}
      />
    </>
  );
}

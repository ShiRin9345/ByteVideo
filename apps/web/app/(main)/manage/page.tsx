"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Edit, Text } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { DataTable } from "@workspace/ui/components/data-table/data-table";
import { DataTableToolbar } from "@workspace/ui/components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@workspace/ui/components/data-table/data-table-column-header";
import { DataTableSortList } from "@workspace/ui/components/data-table/data-table-sort-list";
import { useDataTable } from "@workspace/ui/hooks/use-data-table";
import { getSortingStateParser } from "@workspace/ui/lib/parsers";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchVideoList, type VideoItem } from "@/features/ai/api/video-list";
import { parseAsString } from "nuqs";
import { apiClient } from "@/lib/axios";
import { toast } from "@workspace/ui/components/sonner";

const themes = ["生活", "美食", "旅行", "科技", "娱乐"] as const;

interface EditVideoDialogProps {
  video: VideoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditVideoDialog({
  video,
  open,
  onOpenChange,
  onSuccess,
}: EditVideoDialogProps) {
  const [name, setName] = useState("");
  const [themeInput, setThemeInput] = useState("");
  const queryClient = useQueryClient();

  // 当视频数据变化时，更新表单
  useEffect(() => {
    if (video) {
      setName(video.name);
      setThemeInput(video.theme.join(", "));
    }
  }, [video]);

  const updateVideoMutation = useMutation({
    mutationFn: async (data: { name: string; theme: string[] }) => {
      if (!video) throw new Error("No video selected");
      const response = await apiClient.put(`/video/${video.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("视频信息更新成功");
      queryClient.invalidateQueries({ queryKey: ["video-list"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("更新失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("请输入视频名称");
      return;
    }

    const themeArray = themeInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (themeArray.length === 0) {
      toast.error("请输入至少一个主题");
      return;
    }

    updateVideoMutation.mutate({ name: name.trim(), theme: themeArray });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑视频信息</DialogTitle>
          <DialogDescription>修改视频名称和主题标签</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">视频名称</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入视频名称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-theme">主题（多个主题用逗号分隔）</Label>
              <Input
                id="edit-theme"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="例如: 科技,编程,教程"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={updateVideoMutation.isPending}>
              {updateVideoMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ManagePage() {
  // 从 URL 查询参数读取分页和筛选条件
  const [page] = useQueryState("page", parseAsString.withDefault("1"));
  const [perPage] = useQueryState("perPage", parseAsString.withDefault("10"));
  const [nameFilter] = useQueryState("name", parseAsString);
  const [themeFilter] = useQueryState("theme", parseAsString);

  const pageNum = parseInt(page, 10) || 1;
  const pageSizeNum = parseInt(perPage, 10) || 10;

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

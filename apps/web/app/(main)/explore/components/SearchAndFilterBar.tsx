"use client";

import { Search } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface SearchAndFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: "createdAt" | "likes" | "views";
  onSortByChange: (value: "createdAt" | "likes" | "views") => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
}

export function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: SearchAndFilterBarProps) {
  return (
    <div className="bg-background sticky top-0 z-40 overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* 搜索框 */}
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="搜索视频名称..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* 排序选择器 */}
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">最新发布</SelectItem>
                <SelectItem value="likes">点赞数</SelectItem>
                <SelectItem value="views">播放量</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={onSortOrderChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="排序方向" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">降序</SelectItem>
                <SelectItem value="asc">升序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

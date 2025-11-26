"use client";

import { Skeleton } from "./skeleton";

export function ToolbarSkeleton() {
  return (
    <div className="flex w-full items-start justify-between gap-2 p-1">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

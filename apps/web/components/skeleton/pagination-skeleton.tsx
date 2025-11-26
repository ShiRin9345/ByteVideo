"use client";

import { Skeleton } from "./skeleton";

export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 p-1">
      <Skeleton className="h-7 w-40" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-18" />
        </div>
        <Skeleton className="h-7 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

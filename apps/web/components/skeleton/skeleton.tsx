"use client";

import { cn } from "@workspace/ui/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-muted",
        className,
      )}
      {...props}
    >
      <div className="animate-shimmer bg-shimmer absolute inset-0 h-full w-full -translate-x-full" />
    </div>
  );
}

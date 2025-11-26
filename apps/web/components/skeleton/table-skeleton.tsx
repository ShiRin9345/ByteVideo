"use client";

import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

interface TableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function TableSkeleton({
  columnCount = 6,
  rowCount = 10,
}: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-5 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableCell key={j}>
                  {j === 0 ? (
                    <Skeleton className="h-5 w-32" />
                  ) : j === 1 ? (
                    <Skeleton className="h-6 w-16 rounded-full" />
                  ) : j === columnCount - 1 ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <Skeleton className="h-5 w-20" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

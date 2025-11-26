import { TableSkeleton } from "@/components/skeleton/table-skeleton";
import { ToolbarSkeleton } from "@/components/skeleton/toolbar-skeleton";
import { PaginationSkeleton } from "@/components/skeleton/pagination-skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <ToolbarSkeleton />
      <TableSkeleton columnCount={6} rowCount={10} />
      <PaginationSkeleton />
    </div>
  );
}

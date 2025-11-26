"use client";

import { Button } from "@workspace/ui/components/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <p className="text-destructive text-lg font-medium">
          加载失败，请刷新重试
        </p>
        <Button onClick={() => reset()} className="mt-4">
          重试
        </Button>
      </div>
    </div>
  );
}

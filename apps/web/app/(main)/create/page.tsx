"use client";

import { Suspense } from "react";
import { CreatePageContent } from "./components/CreatePageContent";

function CreatePageFallback() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">视频发布</h1>
      <div className="text-muted-foreground">加载中...</div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<CreatePageFallback />}>
      <CreatePageContent />
    </Suspense>
  );
}

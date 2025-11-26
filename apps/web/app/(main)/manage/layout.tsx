import React from "react";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background h-full p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">视频管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的视频内容，支持筛选、排序和编辑
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

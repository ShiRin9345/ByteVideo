export function LoadingIndicator() {
  return (
    <div
      className="bg-background/95 sticky right-0 bottom-0 left-0 z-10 flex items-center justify-center py-6 backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(to top, var(--background) 0%, var(--background) 50%, transparent 100%)",
      }}
    >
      <div className="bg-card border-border flex items-center gap-3 rounded-full border px-4 py-2 shadow-md">
        <div className="border-muted border-t-foreground size-4 animate-spin rounded-full border-2" />
        <div className="text-foreground text-sm font-medium">加载中...</div>
      </div>
    </div>
  );
}

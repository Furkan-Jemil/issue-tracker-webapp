/**
 * Animated loading skeleton for the dashboard page.
 * Dimensions match the real content to prevent layout shift.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading dashboard…" aria-busy="true">
      {/* Metrics row skeleton */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="h-10 w-full animate-pulse rounded-xl border border-border/60 bg-muted/40 lg:w-1/2" />

      {/* Charts row skeleton */}
      <div className="grid gap-2 lg:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-xl border border-border/60 bg-muted/40" />
        <div className="h-[260px] animate-pulse rounded-xl border border-border/60 bg-muted/40" />
      </div>

      {/* Trend chart skeleton */}
      <div className="h-[260px] animate-pulse rounded-xl border border-border/60 bg-muted/40" />
    </div>
  );
}

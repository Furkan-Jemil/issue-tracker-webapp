/**
 * tasks/loading.tsx
 *
 * Next.js 15 App Router streaming loading UI for the /tasks route segment.
 * This file is automatically rendered by the framework as an instant Suspense
 * fallback while the async Server Component (page.tsx) resolves its Prisma
 * queries and session checks.
 *
 * Layout mirrors the real page structure so there is zero reflow when real
 * content replaces the skeleton:
 *   1. PageHeader placeholder  (title + subtitle bars)
 *   2. Toolbar placeholder     (search input + filter/view toggle buttons)
 *   3. Table placeholder       (header row + N data rows)
 *   4. Pagination placeholder  (Previous / Next buttons)
 */
import { Skeleton } from "@/components/ui/skeleton";

/** Number of skeleton rows to show — matches DEFAULT_PAGE_SIZE feel */
const ROW_COUNT = 10;

export default function TasksLoading() {
  return (
    <div className="page-stack" aria-label="Loading issues…" aria-busy="true">
      {/* ── PageHeader ──────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-72" />
          </div>
          {/* Controls area (theme toggle + bell + profile) */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      </header>

      {/* ── Toolbar (search + filter + view switcher + create button) ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {/* Table header row */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="ml-auto h-3.5 w-14 hidden lg:block" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-16 hidden xl:block" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-10" />
        </div>

        {/* Data rows */}
        <ul className="divide-y divide-border/50">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3"
              style={{ opacity: 1 - i * 0.06 }} // gentle fade toward bottom
            >
              {/* Title — variable width to feel organic */}
              <Skeleton
                className="h-4 shrink"
                style={{ width: `${220 + ((i * 37) % 120)}px` }}
              />
              {/* Type badge */}
              <Skeleton className="ml-auto hidden h-5 w-16 rounded-full lg:block" />
              {/* Priority badge */}
              <Skeleton className="h-5 w-14 rounded-full" />
              {/* Severity badge */}
              <Skeleton className="hidden h-5 w-14 rounded-full xl:block" />
              {/* Status badge */}
              <Skeleton className="h-5 w-20 rounded-full" />
              {/* Action button */}
              <Skeleton className="h-8 w-8 rounded-md" />
            </li>
          ))}
        </ul>

        {/* Table footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </div>
  );
}

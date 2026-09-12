/**
 * tasks/[task-id]/loading.tsx
 *
 * Next.js 15 App Router streaming loading UI for the issue detail route.
 * Mirrors the actual page layout so reflow is eliminated when data arrives:
 *
 *   1. Breadcrumb + PageHeader
 *   2. Metadata stat cards row (Status / Priority / Severity / People)
 *   3. Main content + sidebar grid (description + tracking snapshot)
 *   4. Activity log section
 *   5. Comment thread section
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function TaskDetailLoading() {
  return (
    <div className="page-stack" aria-label="Loading issue…" aria-busy="true">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3 w-10" />
        <span className="text-muted-foreground/40 text-xs">/</span>
        <Skeleton className="h-3 w-20" />
      </div>

      {/* ── PageHeader ───────────────────────────────────────────────────── */}
      <header>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            {/* Issue title as description */}
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      </header>

      {/* ── Metadata stat cards ──────────────────────────────────────────── */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {/* Status */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3 space-y-2">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {/* Priority */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3 space-y-2">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        {/* Severity */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3 space-y-2">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
        {/* People and reporting — spans remaining columns */}
        <div className="rounded-xl border border-border/70 bg-card/80 p-3 space-y-2 sm:col-span-2 xl:col-span-3">
          <Skeleton className="h-2.5 w-36" />
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content + sidebar ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:gap-5">
          {/* Description section */}
          <section className="space-y-5">
            <div className="border-l-4 border-l-slate-300 pl-4 space-y-3">
              <Skeleton className="h-3.5 w-28" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            {/* Evidence section */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-3">
              <Skeleton className="h-3.5 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-20 w-28 rounded-lg" />
                <Skeleton className="h-20 w-28 rounded-lg" />
              </div>
            </div>
          </section>

          {/* Tracking sidebar */}
          <aside className="rounded-xl bg-muted/20 p-3 md:p-4 space-y-3">
            <Skeleton className="h-3.5 w-32" />
            <div className="divide-y divide-border/50 space-y-0">
              {["Issue ID", "Type", "Created", "Updated", "Assignee", "Reporter"].map(
                (label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                ),
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Activity log ─────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-4 space-y-2">
          {[100, 85, 70].map((widthPct) => (
            <div
              key={widthPct}
              className="rounded-lg border border-border/70 bg-background px-3 py-2.5 space-y-1.5"
            >
              <Skeleton className="h-2.5 w-32" />
              <Skeleton className={`h-3.5`} style={{ width: `${widthPct}%` }} />
              <Skeleton className="h-2.5 w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Comment thread ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          ))}
          {/* Comment input area */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </section>

      {/* ── Back button ──────────────────────────────────────────────────── */}
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}

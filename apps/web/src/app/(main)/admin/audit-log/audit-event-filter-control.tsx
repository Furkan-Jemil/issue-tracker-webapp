"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Select } from "@/components/ui/select";

type AuditEvent = "ALL" | "CREATED" | "STATUS_CHANGED" | "COMMENTED";

export default function AuditEventFilterControl({
  current,
  query,
}: {
  current: AuditEvent;
  query?: string;
}) {
  const router = useRouter();

  function onChange(nextValue: string) {
    if (nextValue === current) return;
    const nextParams = new URLSearchParams();
    if (query?.trim()) {
      nextParams.set("q", query.trim());
    }
    if (nextValue === "ALL") {
      const nextQuery = nextParams.toString();
      router.push(nextQuery ? `/admin/audit-log?${nextQuery}` : "/admin/audit-log");
      return;
    }
    nextParams.set("event", nextValue);
    router.push(`/admin/audit-log?${nextParams.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/25 px-2 py-1.5">
      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Select
        aria-label="Filter audit log events"
        value={current}
        onValueChange={onChange}
        className="h-8 w-24 border-0 bg-transparent px-1 text-xs sm:w-[132px]"
      >
        <option value="ALL">All</option>
        <option value="CREATED">Created</option>
        <option value="STATUS_CHANGED">Status</option>
        <option value="COMMENTED">Comments</option>
      </Select>
    </div>
  );
}

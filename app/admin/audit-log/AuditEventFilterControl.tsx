"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Select } from "@/components/ui/select";

type AuditEvent = "ALL" | "CREATED" | "STATUS_CHANGED" | "COMMENTED";

export default function AuditEventFilterControl({
  current,
}: {
  current: AuditEvent;
}) {
  const router = useRouter();

  function onChange(nextValue: string) {
    if (nextValue === current) return;
    if (nextValue === "ALL") {
      router.push("/admin/audit-log");
      return;
    }
    router.push(`/admin/audit-log?event=${nextValue}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/25 px-2 py-1.5">
      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Select
        aria-label="Filter audit log events"
        value={current}
        onValueChange={onChange}
        className="h-8 w-[132px] border-0 bg-transparent px-1 text-xs"
      >
        <option value="ALL">All</option>
        <option value="CREATED">Created</option>
        <option value="STATUS_CHANGED">Status</option>
        <option value="COMMENTED">Comments</option>
      </Select>
    </div>
  );
}

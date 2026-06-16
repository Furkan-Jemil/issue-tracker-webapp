import Link from "next/link";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";
import AuditEventFilterControl from "./audit-event-filter-control";
import ExportDataButton from "../settings/export-data-button";

export function AuditLogToolbar({
  currentEvent,
  query,
}: {
  currentEvent: "ALL" | "CREATED" | "STATUS_CHANGED" | "COMMENTED";
  query?: string;
}) {
  return (
    <div className="grid gap-2 border-b border-border/60 bg-muted/20 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <SearchInput
        placeholder="Search audit log (type at least 2 letters)"
        className="w-full max-w-sm"
      />
      <div className="flex items-center gap-2">
        <AuditEventFilterControl current={currentEvent} query={query} />
        <ExportDataButton compact className="shrink-0" />
        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="System records">
          <Link href="/tasks" aria-label="System records">
            <History className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
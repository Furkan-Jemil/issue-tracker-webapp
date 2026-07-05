"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type AuditEvent = "ALL" | "CREATED" | "STATUS_CHANGED" | "COMMENTED";

const OPTIONS: { value: AuditEvent; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CREATED", label: "Created" },
  { value: "STATUS_CHANGED", label: "Status" },
  { value: "COMMENTED", label: "Comments" },
];

export default function AuditFilterPopover({
  current,
  query,
}: {
  current: AuditEvent;
  query?: string;
}) {
  const router = useRouter();

  function onSelect(nextValue: AuditEvent) {
    if (nextValue === current) return;
    const nextParams = new URLSearchParams();
    if (query?.trim()) {
      nextParams.set("q", query.trim());
    }
    if (nextValue !== "ALL") {
      nextParams.set("event", nextValue);
    }
    const qs = nextParams.toString();
    router.push(qs ? `/admin/audit-log?${qs}` : "/admin/audit-log");
  }

  const currentLabel = OPTIONS.find((o) => o.value === current)?.label ?? "All";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs"
          aria-label="Filter audit log events"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Filter</span>
          {current !== "ALL" && (
            <span className="ml-0.5 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              1
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1.5">
        <div className="space-y-0.5">
          {OPTIONS.map((opt) => (
            <PopoverClose key={opt.value} asChild>
              <button
                type="button"
                onClick={() => onSelect(opt.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                  opt.value === current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    opt.value === current
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30",
                  )}
                >
                  {opt.value === current && (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  )}
                </span>
                {opt.label}
              </button>
            </PopoverClose>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

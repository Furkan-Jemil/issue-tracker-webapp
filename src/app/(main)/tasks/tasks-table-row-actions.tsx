"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { changeIssueStatusQuick } from "@/app/(main)/tasks/tasks-action-menu";

type QuickStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const NEXT_STATUS: Record<QuickStatus, QuickStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: ["OPEN"],
};

function humanizeStatus(status: QuickStatus) {
  if (status === "IN_PROGRESS") return "In progress";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function StatusQuickActions({
  issueId,
  currentStatus,
  editHref,
  allowStatusChange = true,
  allowEdit = true,
}: {
  issueId: string;
  currentStatus: QuickStatus;
  editHref?: string;
  allowStatusChange?: boolean;
  allowEdit?: boolean;
}) {
  const options = NEXT_STATUS[currentStatus] ?? [];
  const visibleOptions = allowStatusChange ? options : [];
  const effectiveEditHref = allowEdit ? editHref : undefined;

  if (!effectiveEditHref && visibleOptions.length === 0) {
    return null;
  }

  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Quick status actions"
          title="Quick status actions"
          className="h-8 w-8 rounded-md"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[198px] p-1" align="end">
        {effectiveEditHref ? (
          <PopoverClose asChild>
            <Link href={effectiveEditHref} className="block rounded-md px-2.5 py-2 text-sm hover:bg-accent">
              Edit
            </Link>
          </PopoverClose>
        ) : null}
        {effectiveEditHref && visibleOptions.length > 0 ? <div className="my-1 h-px bg-border/70" /> : null}
        {visibleOptions.map((status) => (
          <PopoverClose asChild key={status}>
            <button
              type="button"
              className="block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await changeIssueStatusQuick(issueId, status);
                  router.refresh();
                });
              }}
            >
              Move to {humanizeStatus(status)}
            </button>
          </PopoverClose>
        ))}
      </PopoverContent>
    </Popover>
  );
}

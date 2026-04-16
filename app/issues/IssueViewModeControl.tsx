"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Select } from "@/components/ui/select";

type IssueViewMode = "compact" | "details" | "board";

export default function IssueViewModeControl({
  currentView,
  compactHref,
  detailsHref,
  boardHref,
}: {
  currentView: IssueViewMode;
  compactHref: string;
  detailsHref: string;
  boardHref: string;
}) {
  const router = useRouter();

  function onViewChange(nextView: string) {
    if (nextView === currentView) return;
    const hrefByView: Record<IssueViewMode, string> = {
      compact: compactHref,
      details: detailsHref,
      board: boardHref,
    };

    const nextHref = hrefByView[nextView as IssueViewMode];
    if (nextHref) {
      router.push(nextHref);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/25 px-2 py-1.5">
      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <Select
        aria-label="Change issue view mode"
        value={currentView}
        onValueChange={onViewChange}
        className="h-8 w-[136px] border-0 bg-transparent px-1 text-xs font-medium"
      >
        <option value="compact">Compact</option>
        <option value="details">Detailed</option>
        <option value="board">Board</option>
      </Select>
    </div>
  );
}

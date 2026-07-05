"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Filter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type ReporterOption = {
  id: string;
  label: string;
  role: string;
};

const STATUS_OPTS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTS = ["LOW", "MEDIUM", "HIGH"];
const SEVERITY_OPTS = ["MINOR", "MAJOR", "CRITICAL"];

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function setToComma(set: Set<string>): string {
  return Array.from(set).join(",");
}

function commaToSet(value: string): Set<string> {
  if (!value) return new Set();
  return new Set(value.split(",").map((v) => v.trim()).filter(Boolean));
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        selected
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {label}
      {selected && <X className="h-3 w-3" aria-hidden="true" />}
    </button>
  );
}

function FilterSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <Chip
            key={opt}
            label={opt.replace("_", " ")}
            selected={selected.has(opt)}
            onClick={() => onToggle(opt)}
          />
        ))}
      </div>
    </div>
  );
}

export function IssuesFilterPopover({
  isAdmin,
  hasActiveFilters,
  activeFilterCount,
  query,
  createdFrom,
  createdTo,
  status,
  priority,
  severity,
  reporter,
  assignee,
  reporters,
  onResetHref,
}: {
  isAdmin: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  query: string;
  createdFrom: string;
  createdTo: string;
  status: string;
  priority: string;
  severity: string;
  reporter: string;
  assignee: string;
  reporters: ReporterOption[];
  onResetHref: string;
  view?: "compact" | "details" | "board";
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [selStatus, setSelStatus] = useState(() => commaToSet(status));
  const [selPriority, setSelPriority] = useState(() => commaToSet(priority));
  const [selSeverity, setSelSeverity] = useState(() => commaToSet(severity));
  const [selReporter, setSelReporter] = useState(() => commaToSet(reporter));
  const [selAssignee, setSelAssignee] = useState(() => commaToSet(assignee));
  const [localCreatedFrom, setLocalCreatedFrom] = useState(createdFrom);
  const [localCreatedTo, setLocalCreatedTo] = useState(createdTo);

  useEffect(() => {
    if (!isOpen) {
      setSelStatus(commaToSet(status));
      setSelPriority(commaToSet(priority));
      setSelSeverity(commaToSet(severity));
      setSelReporter(commaToSet(reporter));
      setSelAssignee(commaToSet(assignee));
      setLocalCreatedFrom(createdFrom);
      setLocalCreatedTo(createdTo);
    }
  }, [isOpen, status, priority, severity, reporter, assignee, createdFrom, createdTo]);

  const reporterOptions = useMemo(() => reporters, [reporters]);

  const totalSelected =
    selStatus.size + selPriority.size + selSeverity.size + selReporter.size + selAssignee.size +
    (localCreatedFrom ? 1 : 0) + (localCreatedTo ? 1 : 0);

  function applyFilters() {
    const params = new URLSearchParams({ page: "1" });
    if (query) params.set("q", query);
    const s = setToComma(selStatus);
    const p = setToComma(selPriority);
    const sev = setToComma(selSeverity);
    const r = setToComma(selReporter);
    const a = setToComma(selAssignee);
    if (s) params.set("status", s);
    if (p) params.set("priority", p);
    if (sev) params.set("severity", sev);
    if (r) params.set("reporter", r);
    if (a) params.set("assignee", a);
    if (localCreatedFrom) params.set("createdFrom", localCreatedFrom);
    if (localCreatedTo) params.set("createdTo", localCreatedTo);
    router.push(`/tasks?${params.toString()}`);
    setIsOpen(false);
  }

  function clearFilters() {
    const params = new URLSearchParams({ page: "1" });
    if (query) params.set("q", query);
    router.push(`/tasks?${params.toString()}`);
    setIsOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative h-9 gap-1.5 rounded-lg border-border bg-background px-2.5 text-xs"
        aria-label="Open filters"
        title="Filters"
        onClick={() => setIsOpen(true)}
      >
        <Filter className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Filters</span>
        {hasActiveFilters && (
          <Badge
            variant="secondary"
            className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full px-1 py-0 text-[9px] font-bold"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Filter Issues">
        <div className="space-y-5">
          {isAdmin && (
            <>
              <FilterSection
                label="Status"
                options={STATUS_OPTS}
                selected={selStatus}
                onToggle={(v) => setSelStatus((prev) => toggleInSet(prev, v))}
              />
              <FilterSection
                label="Priority"
                options={PRIORITY_OPTS}
                selected={selPriority}
                onToggle={(v) => setSelPriority((prev) => toggleInSet(prev, v))}
              />
              <FilterSection
                label="Severity"
                options={SEVERITY_OPTS}
                selected={selSeverity}
                onToggle={(v) => setSelSeverity((prev) => toggleInSet(prev, v))}
              />
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reporter</p>
                <div className="flex flex-wrap gap-1.5">
                  {reporterOptions.map((u) => (
                    <Chip
                      key={u.id}
                      label={u.label}
                      selected={selReporter.has(u.id)}
                      onClick={() => setSelReporter((prev) => toggleInSet(prev, u.id))}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</p>
                <div className="flex flex-wrap gap-1.5">
                  {reporterOptions.map((u) => (
                    <Chip
                      key={u.id}
                      label={u.label}
                      selected={selAssignee.has(u.id)}
                      onClick={() => setSelAssignee((prev) => toggleInSet(prev, u.id))}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Date range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
              Date range
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={localCreatedFrom}
                onChange={(e) => setLocalCreatedFrom(e.target.value)}
                className="h-9 flex-1 rounded-lg text-xs"
                aria-label="Created from"
              />
              <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                →
              </span>
              <Input
                type="date"
                value={localCreatedTo}
                onChange={(e) => setLocalCreatedTo(e.target.value)}
                className="h-9 flex-1 rounded-lg text-xs"
                aria-label="Created to"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
            <span className="text-xs text-muted-foreground">
              {totalSelected > 0 ? `${totalSelected} filter${totalSelected > 1 ? "s" : ""} active` : "No filters"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={clearFilters}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-lg text-xs"
                disabled={totalSelected === 0 && !hasActiveFilters}
                onClick={applyFilters}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
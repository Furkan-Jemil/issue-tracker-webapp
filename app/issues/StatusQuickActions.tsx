"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { changeIssueStatusQuick } from "@/app/issues/quick-actions";

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
}: {
  issueId: string;
  currentStatus: QuickStatus;
}) {
  const options = NEXT_STATUS[currentStatus] ?? [];
  if (options.length === 0) {
    return null;
  }

  const router = useRouter();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!open) return;
      const target = event.target as Node | null;
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Quick status actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              setActiveIndex(0);
            }
            return next;
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(0);
          }
        }}
        className="h-8 w-8 rounded-full p-0">
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Quick status menu"
          className="absolute right-0 top-9 z-30 min-w-48 rounded-lg border border-border/70 bg-popover p-1.5 shadow-lg"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, options.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            }
            if (event.key === "Home") {
              event.preventDefault();
              setActiveIndex(0);
            }
            if (event.key === "End") {
              event.preventDefault();
              setActiveIndex(options.length - 1);
            }
          }}>
          {options.map((status, index) => (
            <button
              key={status}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm outline-none hover:bg-accent focus:bg-accent"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  await changeIssueStatusQuick(issueId, status);
                  router.refresh();
                });
                triggerRef.current?.focus();
              }}>
              Move to {humanizeStatus(status)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

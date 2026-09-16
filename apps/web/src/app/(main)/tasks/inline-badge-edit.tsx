"use client";

/**
 * InlineBadgeEdit
 *
 * A single-click inline dropdown that replaces a read-only IssueSemanticBadge
 * with an interactive version. Clicking the badge opens a compact option list;
 * selecting an option fires `onChange` immediately (optimistic) and closes.
 *
 * Design decisions:
 *   - No Radix Popover dependency — uses a locally-managed open/close with a
 *     `useEffect` outside-click handler so the bundle is minimal.
 *   - Opens upward when near the bottom of the viewport, downward otherwise
 *     (detected via the button's `getBoundingClientRect`).
 *   - Full keyboard support:
 *       Enter / Space  → open
 *       ArrowDown/Up   → navigate options
 *       Enter          → select focused option
 *       Escape         → close without change
 *       Tab            → close (natural focus move)
 *   - aria-haspopup="listbox" + aria-expanded + aria-activedescendant on the
 *     trigger; role="listbox" + role="option" + aria-selected on the list.
 *   - `disabled` prop: when false the component renders a plain non-interactive
 *     badge, identical to the original IssueSemanticBadge, so non-admins see
 *     no affordance for interaction.
 *   - `isPending` prop: shows a subtle spinner overlay on the badge while the
 *     server action is in-flight, preventing double-click.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";

import { IssueSemanticBadge } from "@/app/(main)/tasks/task-semantic-badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Kind = "status" | "priority";

type Option = {
  value: string;
  label: string;
};

// ─── Option sets ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Option[] = [
  { value: "OPEN",        label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED",    label: "Resolved" },
  { value: "CLOSED",      label: "Closed" },
];

const PRIORITY_OPTIONS: Option[] = [
  { value: "LOW",    label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High" },
];

function getOptions(kind: Kind): Option[] {
  return kind === "status" ? STATUS_OPTIONS : PRIORITY_OPTIONS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InlineBadgeEdit({
  kind,
  value,
  onChange,
  disabled = false,
  isPending = false,
  badgeClassName,
  renderBadge,
}: {
  kind: Kind;
  value: string;
  /** Called with the newly selected value. The caller is responsible for
   *  optimistic state updates and server action dispatch. */
  onChange: (next: string) => void;
  /** When false the badge is read-only. Defaults to false. */
  disabled?: boolean;
  /** Shows a spinner overlay on the badge while a mutation is in-flight. */
  isPending?: boolean;
  /** Extra classes forwarded to the inner IssueSemanticBadge. */
  badgeClassName?: string;
  /** Optional custom badge renderer. If provided, uses this instead of IssueSemanticBadge. */
  renderBadge?: (value: string) => React.ReactNode;
}) {
  const uid = useId();
  const options = getOptions(kind);

  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  // true = drop downward, false = drop upward
  const [dropDown, setDropDown] = useState(true);

  const triggerRef  = useRef<HTMLButtonElement>(null);
  const listRef     = useRef<HTMLUListElement>(null);
  const listboxId   = `${uid}-listbox`;

  // ── Outside-click / focus-leave close ────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // ── Focus first item when list opens ─────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    // Pre-select the current value so arrow keys start from the right place.
    const idx = options.findIndex((o) => o.value === value);
    setActiveIdx(idx >= 0 ? idx : 0);

    // Focus the list so arrow keys work immediately.
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open, options, value]);

  // ── Scroll active item into view ──────────────────────────────────────────

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`,
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  // ── Trigger click ─────────────────────────────────────────────────────────

  function handleTriggerClick() {
    if (disabled || isPending) return;

    // Determine drop direction before opening.
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropDown(spaceBelow > 140); // ~5 option rows * ~28px
    }

    setOpen((v) => !v);
  }

  // ── Keyboard on trigger ───────────────────────────────────────────────────

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled || isPending) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerClick();
    }
  }

  // ── Keyboard on list ──────────────────────────────────────────────────────

  function handleListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const opt = options[activeIdx];
        if (opt && opt.value !== value) onChange(opt.value);
        setOpen(false);
        triggerRef.current?.focus();
        break;
      }
      case "Escape":
      case "Tab":
        e.key === "Escape" && e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }

  // ── Select via click ──────────────────────────────────────────────────────

  function handleOptionClick(opt: Option) {
    if (opt.value !== value) onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // ── Read-only render ──────────────────────────────────────────────────────

  if (disabled) {
    if (renderBadge) {
      return <>{renderBadge(value)}</>;
    }
    return (
      <IssueSemanticBadge
        kind={kind}
        value={value}
        className={cn("px-2.5 py-1 text-[11px]", badgeClassName)}
      />
    );
  }

  // ── Interactive render ────────────────────────────────────────────────────

  const badgeElement = renderBadge ? (
    renderBadge(value)
  ) : (
    <IssueSemanticBadge
      kind={kind}
      value={value}
      className={cn("px-2.5 py-1 text-[11px]", badgeClassName)}
    />
  );

  return (
    <div className="relative inline-flex">
      {/* Trigger — the badge itself is the button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={`Change ${kind}: current value ${value}`}
        aria-activedescendant={
          open ? `${uid}-opt-${activeIdx}` : undefined
        }
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        disabled={isPending}
        className={cn(
          "cursor-pointer rounded-full transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          isPending && "pointer-events-none opacity-60",
          // Subtle hover ring to hint interactivity
          !isPending && "hover:ring-2 hover:ring-ring/40 hover:ring-offset-1",
        )}
      >
        {/* Badge display */}
        {badgeElement}

        {/* Pending spinner overlay */}
        {isPending ? (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60"
            aria-hidden="true"
          >
            <Loader2 className="h-3 w-3 animate-spin text-foreground/70" aria-hidden />
          </span>
        ) : null}
      </button>

      {/* Dropdown list */}
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={`${kind} options`}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className={cn(
            "absolute z-50 min-w-[140px] overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg focus:outline-none",
            // Open direction
            dropDown
              ? "left-0 top-full mt-1"
              : "bottom-full left-0 mb-1",
          )}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive   = idx === activeIdx;

            return (
              <li
                key={opt.value}
                id={`${uid}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                data-idx={idx}
                onPointerDown={(e) => {
                  // Prevent the outside-click handler from firing before this.
                  e.preventDefault();
                  handleOptionClick(opt);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-sm transition-colors",
                  isActive && "bg-accent text-accent-foreground",
                  !isActive && "hover:bg-accent/60",
                )}
              >
                {renderBadge ? (
                  renderBadge(opt.value)
                ) : (
                  <IssueSemanticBadge
                    kind={kind}
                    value={opt.value}
                    className="pointer-events-none px-2 py-0.5 text-[10px]"
                  />
                )}
                {isSelected ? (
                  <span className="ml-auto text-[10px] font-semibold text-primary">
                    ✓
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

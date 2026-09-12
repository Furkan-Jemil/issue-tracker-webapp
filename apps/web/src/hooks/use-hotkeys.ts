"use client";

/**
 * useHotkeys
 *
 * A zero-dependency keyboard shortcut registry for the application shell.
 *
 * Design decisions:
 *   - Guards against firing inside text inputs, textareas, selects, and
 *     contenteditable elements. This is the single most important rule for
 *     productivity hotkeys — they must not fire while the user is typing.
 *   - Each binding is described by a `HotkeyBinding` object so registrations
 *     are data-driven and easy to audit/extend.
 *   - Modifier support: ctrl/meta, shift, alt can all be declared.
 *   - Returns a cleanup function from useEffect so registrations are
 *     automatically removed on unmount.
 *   - Single global keydown listener per hook instance — no per-binding
 *     listener multiplication.
 *
 * Usage:
 *   useHotkeys([
 *     { key: "c", handler: () => router.push("/tasks/new") },
 *     { key: "/", handler: openSearch },
 *     { key: "Escape", ignoreInputGuard: true, handler: closeOverlay },
 *   ]);
 */

import { useEffect } from "react";

export type HotkeyBinding = {
  /**
   * The key value as reported by KeyboardEvent.key.
   * Case-insensitive for single letter keys ("c" matches "C" and "c").
   * Use exact casing for special keys: "Escape", "ArrowDown", etc.
   */
  key: string;

  /** Require Ctrl (Windows/Linux) or Cmd (macOS) to be held. Default: false */
  ctrl?: boolean;

  /** Require Shift to be held. Default: false */
  shift?: boolean;

  /** Require Alt / Option to be held. Default: false */
  alt?: boolean;

  /**
   * When true, the handler fires even when focus is inside an input,
   * textarea, select, or contenteditable element. Use for global escape/close
   * bindings where you explicitly want to interrupt editing.
   * Default: false
   */
  ignoreInputGuard?: boolean;

  /** The function to invoke when the binding is matched. */
  handler: (event: KeyboardEvent) => void;
};

/**
 * Returns true when the keyboard event originated from inside a text-entry
 * element. Used to suppress single-key hotkeys while the user is typing.
 */
function isTypingContext(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  if (
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true" ||
    target.getAttribute("contenteditable") === ""
  ) {
    return true;
  }

  // Radix UI portals sometimes wrap in a [role="combobox"] div
  if (target.getAttribute("role") === "combobox") {
    return true;
  }

  return false;
}

export function useHotkeys(bindings: HotkeyBinding[]): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      for (const binding of bindings) {
        // ── Modifier matching ──────────────────────────────────────────
        const needsCtrl = binding.ctrl ?? false;
        const needsShift = binding.shift ?? false;
        const needsAlt = binding.alt ?? false;

        if (needsCtrl && !(event.ctrlKey || event.metaKey)) continue;
        if (!needsCtrl && (event.ctrlKey || event.metaKey)) continue;
        if (needsShift !== event.shiftKey) continue;
        if (needsAlt !== event.altKey) continue;

        // ── Key matching (case-insensitive for single chars) ───────────
        const eventKey = event.key;
        const bindingKey = binding.key;
        const matches =
          eventKey === bindingKey ||
          (bindingKey.length === 1 &&
            eventKey.toLowerCase() === bindingKey.toLowerCase());

        if (!matches) continue;

        // ── Input guard ────────────────────────────────────────────────
        if (!binding.ignoreInputGuard && isTypingContext(event)) continue;

        // ── Fire ───────────────────────────────────────────────────────
        binding.handler(event);
        // Do not break — allow multiple bindings to share the same key if
        // they have different modifier requirements.
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // Re-register whenever the bindings array identity changes.
    // Callers should memoize their binding arrays with useMemo or define
    // them outside the component to avoid unnecessary re-registrations.
  }, [bindings]);
}

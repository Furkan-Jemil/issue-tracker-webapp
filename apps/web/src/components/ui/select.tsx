"use client";

/**
 * Select — native <select> wrapper
 *
 * Replaces the previous Radix SelectPrimitive implementation which was broken
 * inside drawers/portals: the Radix trigger's onPointerDown event was swallowed
 * by the drawer backdrop, making dropdowns appear static and non-interactive.
 *
 * A native <select> is:
 *   - Always interactive regardless of z-index, portal, or drawer context
 *   - Fully accessible out of the box (keyboard, screen reader, mobile)
 *   - Natively wired into FormData — no hidden input tricks needed
 *   - Accepts <option> children directly, zero API change for callers
 *
 * The visual style matches the Input/Textarea components in this design system.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Alias for `onChange` that fires with just the value string.
   * Provided so callers that used the Radix onValueChange prop still work
   * without any changes.
   */
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onChange, onValueChange, ...props }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
      onChange?.(e);
      onValueChange?.(e.target.value);
    }

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            // Match Input height, border, background, text size exactly
            "h-10 w-full appearance-none rounded-md border border-input bg-background",
            "pl-3 pr-9 py-2 text-sm text-foreground",
            "ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Ensure option background works in dark mode
            "[&>option]:bg-background [&>option]:text-foreground",
            className,
          )}
          onChange={handleChange}
          {...props}
        >
          {children}
        </select>
        {/* Custom chevron — replaces the browser default arrow for visual consistency */}
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
          aria-hidden="true"
        />
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };

"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionDef = {
  value: string;
  label: string;
  disabled?: boolean;
};

// Radix Select requires a non-empty string for every item value.
// We map the empty string ("Unassigned") to this sentinel so Radix is happy,
// then map it back before calling onChange / onValueChange.
const EMPTY_VALUE = "__EMPTY__";

function toRadix(value: string): string {
  return value === "" ? EMPTY_VALUE : value;
}

function fromRadix(value: string): string {
  return value === EMPTY_VALUE ? "" : value;
}

// Walk the children tree once and extract <option> elements into a flat list.
function extractOptions(children: React.ReactNode): OptionDef[] {
  const options: OptionDef[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (typeof child.type === "string" && child.type === "option") {
      const el = child as React.ReactElement<{
        value?: string | number | readonly string[];
        children?: React.ReactNode;
        disabled?: boolean;
      }>;
      const value = String(el.props.value ?? "");
      const rawLabel = el.props.children;
      const label =
        typeof rawLabel === "string" ? rawLabel : String(rawLabel ?? value);
      options.push({ value, label, disabled: Boolean(el.props.disabled) });
    }
  });
  return options;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SelectProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
  /** Controlled value. When provided the component is fully controlled. */
  value?: string;
  /** Initial value for uncontrolled usage (e.g. inside a plain <form>). */
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Fires a synthetic ChangeEvent so this drop-in replaces <select> with no refactoring. */
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Fires with the raw string value — convenient for React-state-driven forms. */
  onValueChange?: (value: string) => void;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      name,
      id,
      value: controlledValue,
      defaultValue,
      disabled,
      required,
      onChange,
      onValueChange,
      placeholder,
      onPointerDown,
      onMouseDown,
      onClick,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
    },
    _ref,
  ) => {
    // Extract options once per children change.
    const options = React.useMemo(() => extractOptions(children), [children]);

    // ── Internal state for uncontrolled mode ────────────────────────────────
    // When `value` prop is NOT provided we own the selection state here.
    // This is the critical fix: previously selectedValue was re-derived from
    // defaultValue on every render, so the hidden input never updated and the
    // Radix trigger received the same value prop every render, making it appear
    // to duplicate options in the dropdown trigger.
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      // Seed from defaultValue, fall back to first option, fall back to "".
      if (defaultValue !== undefined) return defaultValue;
      return options[0]?.value ?? "";
    });

    // The single source of truth for what is currently selected.
    const selectedValue = isControlled ? controlledValue : internalValue;

    // ── Change handler ───────────────────────────────────────────────────────
    function handleValueChange(radixValue: string) {
      const realValue = fromRadix(radixValue);

      if (!isControlled) {
        setInternalValue(realValue);
      }

      onValueChange?.(realValue);

      if (onChange) {
        const noop = () => {};
        const target = {
          value: realValue,
          name: name ?? "",
          id: id ?? "",
        };
        onChange({
          target,
          currentTarget: target,
          preventDefault: noop,
          stopPropagation: noop,
        } as React.ChangeEvent<HTMLSelectElement>);
      }
    }

    return (
      <>
        {/*
          Radix SelectPrimitive.Root is fully controlled: we pass `value` so
          the trigger always reflects the current selection, and we update
          state in onValueChange. This prevents the "frozen trigger" bug where
          the visible text never changed after the first render.
        */}
        <SelectPrimitive.Root
          value={toRadix(selectedValue)}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectPrimitive.Trigger
            id={id}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            onPointerDown={onPointerDown}
            onMouseDown={onMouseDown}
            onClick={onClick}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
          >
            <SelectPrimitive.Value placeholder={placeholder ?? "Select an option"} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              data-select-content="true"
              className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
              position="popper"
            >
              <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
                <ChevronUp className="h-4 w-4" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value === "" ? "__empty-option" : option.value}
                    value={toRadix(option.value)}
                    disabled={option.disabled}
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
                <ChevronDown className="h-4 w-4" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {/*
          Hidden native input carries the value into FormData on submit.
          Its value is kept in sync with selectedValue so it always reflects
          whatever the user last selected — not just the initial defaultValue.
        */}
        <input
          type="hidden"
          id={id ? `${id}-hidden` : undefined}
          name={name}
          value={selectedValue}
          required={required}
          aria-hidden="true"
          tabIndex={-1}
          readOnly
        />
      </>
    );
  },
);

Select.displayName = "Select";

export { Select };

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type OptionDef = {
  value: string;
  label: string;
  disabled?: boolean;
};

const EMPTY_VALUE = "__SHADCN_EMPTY__";

function normalizeValue(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function denormalizeValue(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}

function extractOptions(children: React.ReactNode) {
  const options: OptionDef[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (typeof child.type === "string" && child.type === "option") {
      const value = String(child.props.value ?? "");
      const rawLabel = child.props.children;
      const label = typeof rawLabel === "string" ? rawLabel : String(rawLabel ?? value);
      options.push({
        value,
        label,
        disabled: Boolean(child.props.disabled),
      });
    }
  });
  return options;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      name,
      id,
      value,
      defaultValue,
      disabled,
      required,
      onChange,
      onValueChange,
      placeholder,
      onPointerDown,
      onMouseDown,
      onClick,
      ...props
    },
    ref,
  ) => {
    const options = React.useMemo(() => extractOptions(children), [children]);
    const selectedValue =
      value === undefined
        ? String(defaultValue ?? options[0]?.value ?? "")
        : String(value);
    const normalizedValue = normalizeValue(selectedValue);

    function handleValueChange(nextValue: string) {
      const realValue = denormalizeValue(nextValue);
      onValueChange?.(realValue);
      if (onChange) {
        onChange(
          {
            target: { value: realValue, name: name ?? "", id: id ?? "" },
          } as React.ChangeEvent<HTMLSelectElement>,
        );
      }
    }

    return (
      <>
        <SelectPrimitive.Root
          value={normalizedValue}
          onValueChange={handleValueChange}
          disabled={disabled}>
          <SelectPrimitive.Trigger
            id={id}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            onPointerDown={onPointerDown}
            onMouseDown={onMouseDown}
            onClick={onClick}
            {...props}>
            <SelectPrimitive.Value placeholder={placeholder ?? "Select an option"} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
              position="popper">
              <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
                <ChevronUp className="h-4 w-4" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value || "__empty-option"}
                    value={normalizeValue(option.value)}
                    disabled={option.disabled}
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        <input
          ref={ref}
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

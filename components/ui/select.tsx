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
      const optionElement = child as React.ReactElement<{
        value?: string | number | readonly string[];
        children?: React.ReactNode;
        disabled?: boolean;
      }>;
      const value = String(optionElement.props.value ?? "");
      const rawLabel = optionElement.props.children;
      const label =
        typeof rawLabel === "string" ? rawLabel : String(rawLabel ?? value);
      options.push({
        value,
        label,
        disabled: Boolean(optionElement.props.disabled),
      });
    }
  });
  return options;
}

export interface SelectProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
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
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
    },
    _ref,
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
        const noop = () => {};
        const target = { value: realValue, name: name ?? "", id: id ?? "" };
        onChange(
          {
            target,
            currentTarget: target,
            preventDefault: noop,
            stopPropagation: noop,
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
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}>
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

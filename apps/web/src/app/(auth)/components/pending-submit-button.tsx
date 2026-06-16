"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Omit<ButtonProps, "type" | "disabled"> & {
  pendingLabel: string;
};

export function PendingSubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(className)}
      aria-busy={pending}
      {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

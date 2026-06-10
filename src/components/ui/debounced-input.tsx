"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (val: string) => void;
  debounceMs?: number;
}

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 300,
  ...props
}: DebouncedInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [value, debounceMs, onChange]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

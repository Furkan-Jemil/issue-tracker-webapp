"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  placeholder = "Search",
  queryParam = "q",
  minChars = 2,
  resetPageParam = "page",
  className,
}: {
  placeholder?: string;
  queryParam?: string;
  minChars?: number;
  resetPageParam?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialValue = searchParams.get(queryParam) ?? "";
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const currentQuery = useMemo(() => searchParams.toString(), [searchParams]);

  function applySearch(nextValue: string) {
    const trimmed = nextValue.trim();
    const charCount = trimmed.length;

    if (trimmed !== "" && charCount < minChars) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (trimmed === "") {
      params.delete(queryParam);
    } else {
      params.set(queryParam, trimmed);
    }

    if (resetPageParam) {
      params.set(resetPageParam, "1");
    }

    const nextQuery = params.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applySearch(value);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        aria-label="Search"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
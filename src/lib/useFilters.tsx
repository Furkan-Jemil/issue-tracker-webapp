"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildIssueFilterSearchParams,
  type IssueFilterState,
} from "@/lib/filterRouting";

export function useFilters(initial: IssueFilterState, opts?: {
  onSubmitHref?: string;
  onResetHref?: string;
  onApply?: (drafts: IssueFilterState) => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [drafts, setDrafts] = useState<IssueFilterState>(initial || {});

  useEffect(() => {
    setDrafts(initial || {});
  }, [initial?.view, initial?.q, initial?.createdFrom, initial?.createdTo, initial?.status, initial?.priority, initial?.severity, initial?.reporter, initial?.assignee]);

  function setField<K extends keyof IssueFilterState>(key: K, value: IssueFilterState[K]) {
    setDrafts((d) => ({ ...d, [key]: value }));
  }

  function apply(event?: React.FormEvent) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    const nextParams = buildIssueFilterSearchParams(drafts);
    setIsOpen(false);
    if (opts?.onApply) {
      opts.onApply(drafts);
      return;
    }
    if (opts?.onSubmitHref) {
      router.push(`${opts.onSubmitHref}?${nextParams.toString()}`);
    }
  }

  function clear() {
    setDrafts({});
    setIsOpen(false);
    if (opts?.onApply) {
      opts.onApply({});
      return;
    }
    if (opts?.onResetHref) router.push(opts.onResetHref);
  }

  return {
    drafts,
    setDrafts,
    setField,
    apply,
    clear,
    isOpen,
    setIsOpen,
  } as const;
}

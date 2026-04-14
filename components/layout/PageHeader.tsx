import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  icon: Icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  icon?: PageHeaderIcon;
}) {
  return (
    <header className={cn("space-y-2", className)}>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm shadow-black/5 md:flex-row md:items-center md:justify-between md:p-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground shadow-sm">
              <Icon className="h-5 w-5" aria-hidden={true} />
            </div>
          ) : null}
          <div className="space-y-1">
            <h1 className="page-title">{title}</h1>
            {description ? <p className="page-subtitle max-w-2xl">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
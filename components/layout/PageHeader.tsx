import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { ICON_STROKE, ICON_STYLE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}>;

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
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <span
              key={`${item.label}-${index}`}
              className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <Card className="premium-panel relative isolate flex flex-col gap-3 overflow-hidden rounded-3xl px-3.5 py-3 md:flex-row md:items-center md:justify-between md:px-5 md:py-4">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 top-0 h-24 w-44 rounded-full bg-primary/20 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-0 h-16 w-28 rounded-full bg-chart-2/20 blur-2xl"
        />
        <CardContent className="flex items-center justify-between gap-2 p-0">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/75 bg-gradient-to-br from-background/95 to-accent/35 text-muted-foreground shadow-sm">
                <Icon
                  className={ICON_STYLE.header}
                  strokeWidth={ICON_STROKE.header}
                  aria-hidden={true}
                />
              </div>
            ) : null}
            <div className="space-y-1">
              <h1 className="page-title leading-tight">{title}</h1>
              {description ? (
                <p className="page-subtitle max-w-2xl text-muted-foreground/95">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {actions}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </header>
  );
}

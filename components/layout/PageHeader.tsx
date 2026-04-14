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
    <header className={cn("space-y-1.5", className)}>
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

      <Card className="premium-panel relative isolate flex flex-col gap-2.5 overflow-hidden rounded-2xl px-3 py-2.5 md:flex-row md:items-center md:justify-between md:px-4 md:py-3">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-0 h-24 w-40 rounded-full bg-primary/15 blur-2xl"
        />
        <CardContent className="flex items-center justify-between gap-2 p-0">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-background to-muted/35 text-muted-foreground shadow-sm">
                <Icon
                  className={ICON_STYLE.header}
                  strokeWidth={ICON_STROKE.header}
                  aria-hidden={true}
                />
              </div>
            ) : null}
            <div className="space-y-1">
              <h1 className="page-title">{title}</h1>
              {description ? (
                <p className="page-subtitle max-w-2xl">{description}</p>
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

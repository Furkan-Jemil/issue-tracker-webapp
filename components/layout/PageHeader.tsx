import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { AppShellControls } from "@/components/layout/AppShellControls";
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
    <header
      className={cn(
        "relative rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-sm md:p-5",
        className,
      )}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[hsl(198_78%_64%/0.08)] blur-3xl"
      />

      {breadcrumbs?.length ? (
        <nav
          aria-label="Breadcrumb"
          className="relative z-10 mb-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <span
              key={`${item.label}-${index}`}
              className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-muted-foreground/50">
                  /
                </span>
              )}
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

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground shadow-sm">
              <Icon
                className={ICON_STYLE.header}
                strokeWidth={ICON_STROKE.header}
                aria-hidden={true}
              />
            </div>
          ) : null}
          <div className="space-y-1">
            <h1 className="page-title text-balance leading-tight">{title}</h1>
            {description ? (
              <p className="page-subtitle max-w-2xl text-balance text-muted-foreground/95">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-background/75 p-2 shadow-sm">
              {actions}
            </div>
          ) : null}
          <div className="rounded-2xl border border-border/70 bg-background/75 p-1.5 shadow-sm">
            <AppShellControls className="pointer-events-auto relative" />
          </div>
        </div>
      </div>
    </header>
  );
}

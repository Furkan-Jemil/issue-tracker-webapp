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
    <header className={cn("space-y-2", className)}>

      {breadcrumbs?.length ? (
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/35 text-muted-foreground">
              <Icon
                className={ICON_STYLE.header}
                strokeWidth={ICON_STROKE.header}
                aria-hidden={true}
              />
            </div>
          ) : null}
          <div className="space-y-1">
            <h1 className="page-title text-lg md:text-xl font-semibold leading-tight">{title}</h1>
            {description ? (
              <p className="page-subtitle max-w-2xl text-sm text-muted-foreground/95">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {actions}
          <AppShellControls className="pointer-events-auto relative" />
        </div>
      </div>
    </header>
  );
}

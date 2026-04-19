import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

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

      <div className="flex flex-col gap-2 px-0.5 py-0.5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon ? (
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground/85">
              <Icon
                className={ICON_STYLE.header}
                strokeWidth={ICON_STROKE.header}
                aria-hidden={true}
              />
            </div>
          ) : null}
          <div className="space-y-0.5">
            <h1 className="page-title leading-tight">{title}</h1>
            {description ? (
              <p className="page-subtitle max-w-xl text-muted-foreground/95">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

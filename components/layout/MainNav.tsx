"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MainNavItem = { href: string; label: string };

function isActive(pathname: string, href: string) {
  if (href === "/issues") {
    return pathname === "/issues" || pathname.startsWith("/issues/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav({
  items,
  className,
}: {
  items: MainNavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn("flex flex-wrap items-center gap-1", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Button
            key={item.href}
            asChild
            size="sm"
            variant={active ? "default" : "ghost"}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
              active ? "shadow-sm shadow-primary/25" : "text-muted-foreground",
            )}>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}

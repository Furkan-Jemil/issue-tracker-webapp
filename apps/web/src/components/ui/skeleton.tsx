import { cn } from "@/lib/utils";

/**
 * Skeleton
 *
 * A single building-block for skeleton loading states. Renders a rounded
 * rectangle with a CSS shimmer sweep animation defined in tailwind.css.
 *
 * Usage:
 *   <Skeleton className="h-5 w-32" />          // inline label placeholder
 *   <Skeleton className="h-10 w-full" />        // full-width row
 *   <Skeleton className="h-32 w-full" />        // card / chart placeholder
 *
 * The component intentionally has no children — it is a pure presentational
 * block. Compose multiple instances to represent real layouts.
 *
 * Accessibility: aria-hidden="true" is set so screen readers skip the
 * placeholder entirely and wait for real content.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  );
}

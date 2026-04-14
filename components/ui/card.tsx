import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden text-card-foreground",
  {
    variants: {
      tone: {
        default: "border border-border/75 bg-gradient-to-br from-card/98 via-card/95 to-muted/20 shadow-[0_10px_26px_rgba(2,8,23,0.06)] backdrop-blur-[2px] ring-1 ring-white/30 dark:ring-white/5",
        soft: "border border-border/60 bg-gradient-to-br from-muted/25 to-card/60 shadow-[0_8px_20px_rgba(2,8,23,0.05)]",
      },
      density: {
        default: "rounded-2xl",
        dense: "rounded-xl",
      },
    },
    defaultVariants: {
      tone: "default",
      density: "default",
    },
  },
);

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, tone, density, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      cardVariants({ tone, density }),
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-[var(--card-gap)] px-[var(--card-pad)] pb-[calc(var(--card-pad)-0.125rem)] pt-[var(--card-pad)]", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-tight tracking-tight text-foreground/95 md:text-lg",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-[var(--card-pad)] pb-[var(--card-pad)] pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-[var(--card-pad)] pb-[var(--card-pad)] pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

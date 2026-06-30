// Utility function for merging Tailwind classes (from shadcn/ui docs)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date/string as "DD/MM/YYYY, HH:MM" in UTC+3 (EAT — EthioTelecom local time).
 * Used in tables, activity logs, and task detail views.
 */
export function formatDate(d: Date | string): string {
  const date = new Date(d);
  const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000); // UTC+3
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(eat.getUTCDate())}/${pad(eat.getUTCMonth() + 1)}/${eat.getUTCFullYear()}, ${pad(eat.getUTCHours())}:${pad(eat.getUTCMinutes())}`;
}

/**
 * Formats a date/string as "DD/MM/YYYY, HH:MM:SS" in UTC+3 (EAT).
 * Used where seconds precision is needed (e.g. task detail).
 */
export function formatDateWithSeconds(d: Date | string): string {
  const date = new Date(d);
  const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(eat.getUTCDate())}/${pad(eat.getUTCMonth() + 1)}/${eat.getUTCFullYear()}, ${pad(eat.getUTCHours())}:${pad(eat.getUTCMinutes())}:${pad(eat.getUTCSeconds())}`;
}

/**
 * Formats a date for chart labels — "Jun 30" style, in local browser time.
 */
export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-ET", { month: "short", day: "numeric", timeZone: "Africa/Addis_Ababa" });
}

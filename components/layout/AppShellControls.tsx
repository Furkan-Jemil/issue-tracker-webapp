"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Moon, SunMedium } from "lucide-react";

import NotificationBell from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ICON_STROKE } from "@/lib/uiTokens";
import { useAppShellProfile } from "@/components/layout/AppShellProfileContext";

export function AppShellControls({ className }: { className?: string }) {
  const profile = useAppShellProfile();
  const profileName = profile?.profileName ?? "Signed-in User";
  const profileEmail = profile?.profileEmail ?? "No email";
  const initialTheme = profile?.initialTheme ?? "light";

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const themeTransitionTimeoutRef = useRef<number | null>(null);

  const profileInitials =
    profileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  function applyTheme(nextTheme: "light" | "dark", animated: boolean) {
    const root = document.documentElement;
    if (animated) {
      root.classList.add("theme-transition");
      if (themeTransitionTimeoutRef.current !== null) {
        window.clearTimeout(themeTransitionTimeoutRef.current);
      }
      themeTransitionTimeoutRef.current = window.setTimeout(() => {
        root.classList.remove("theme-transition");
        themeTransitionTimeoutRef.current = null;
      }, 220);
    }
    root.classList.toggle("dark", nextTheme === "dark");
  }

  function persistTheme(nextTheme: "light" | "dark") {
    window.localStorage.setItem("app-theme", nextTheme);
    document.cookie = `app-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("app-theme");
    const nextTheme = stored === "dark" || stored === "light" ? stored : initialTheme;

    setTheme(nextTheme);
    persistTheme(nextTheme);
    applyTheme(nextTheme, false);
  }, [initialTheme]);

  useEffect(() => {
    return () => {
      if (themeTransitionTimeoutRef.current !== null) {
        window.clearTimeout(themeTransitionTimeoutRef.current);
      }
      document.documentElement.classList.remove("theme-transition");
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!profileMenuOpen) return;
      const target = event.target as Node | null;
      if (target && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileMenuOpen]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    persistTheme(nextTheme);
    applyTheme(nextTheme, true);
  }

  return (
    <div ref={profileMenuRef} className={className ?? "pointer-events-auto relative"}>
      <div className="flex items-center gap-1.5 px-1 py-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="h-8 w-8 rounded-md text-muted-foreground">
          {theme === "dark" ? (
            <SunMedium className="h-4 w-4" strokeWidth={ICON_STROKE.control} aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={ICON_STROKE.control} aria-hidden="true" />
          )}
        </Button>
        <NotificationBell className="h-8 w-8 text-muted-foreground" />
        <Button
          type="button"
          variant="ghost"
          aria-label={`Profile menu for ${profileName}`}
          aria-expanded={profileMenuOpen}
          onClick={() => setProfileMenuOpen((current) => !current)}
          className="group h-8 gap-0 rounded-md px-1 text-xs font-medium text-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground">
            {profileInitials}
          </span>
          <span className="ml-2 max-w-[120px] overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200">
            {profileName}
          </span>
        </Button>
      </div>

      {profileMenuOpen && (
        <Card className="absolute right-0 top-12 z-50 w-64 rounded-xl border-border p-2.5 shadow-md">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>
          </div>
          <div className="mt-2">
            <Button asChild variant="outline" className="h-9 w-full rounded-md border-border bg-card px-3 text-xs">
              <Link href="/logout">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

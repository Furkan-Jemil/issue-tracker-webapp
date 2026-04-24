"use client";

import { createContext, useContext } from "react";

type AppShellProfileContextValue = {
  profileName: string;
  profileEmail: string;
  initialTheme: "light" | "dark";
};

const AppShellProfileContext = createContext<AppShellProfileContextValue | null>(null);

export function AppShellProfileProvider({
  value,
  children,
}: {
  value: AppShellProfileContextValue;
  children: React.ReactNode;
}) {
  return <AppShellProfileContext.Provider value={value}>{children}</AppShellProfileContext.Provider>;
}

export function useAppShellProfile() {
  return useContext(AppShellProfileContext);
}

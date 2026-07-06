"use client";

import { useFormStatus } from "react-dom";
import { Zap, Loader2 } from "lucide-react";
import type { Role } from "@prisma/client";

interface QuickLoginButtonProps {
  name: string;
  email: string;
  role: Role;
}

export function QuickLoginButton({ name, email, role }: QuickLoginButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-60">
      {pending ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" aria-hidden />
      ) : (
        <Zap className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      )}
      <span className="font-medium text-foreground">
        {pending ? `Signing in as ${name}…` : name}
      </span>
      {!pending && <span className="text-muted-foreground">{email}</span>}
      <span className="ml-auto shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
        {role}
      </span>
    </button>
  );
}

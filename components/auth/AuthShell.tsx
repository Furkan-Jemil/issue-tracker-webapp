import type { ReactNode } from "react";
import { Ticket, Sparkles } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full lg:min-h-[calc(100vh-6rem)]">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-center lg:gap-8">
        <div className="relative hidden overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-6 shadow-lg shadow-primary/5 backdrop-blur-sm lg:block lg:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[hsl(198_78%_64%/0.14)] blur-3xl"
          />
          <div className="relative space-y-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Ticket className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="space-y-3">
              <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Ship quality with a clear issue workflow
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Report bugs, triage with your team, and keep everyone aligned—
                without losing context.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>Roles for users, testers, and admins</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>History, comments, and notifications built in</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex w-full justify-center lg:justify-end">{children}</div>
      </div>
    </div>
  );
}

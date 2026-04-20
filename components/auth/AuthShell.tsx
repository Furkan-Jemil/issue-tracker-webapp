import type { ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  MessageSquareDot,
  ShieldCheck,
  Ticket,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({ children }: { children: ReactNode }) {
  const quickSignals = [
    { icon: Activity, label: "Live activity", tone: "text-primary" },
    { icon: Workflow, label: "Workflow", tone: "text-violet-500" },
    { icon: CheckCircle2, label: "Completed", tone: "text-emerald-500" },
    { icon: Clock3, label: "In queue", tone: "text-amber-500" },
    { icon: MessageSquareDot, label: "Comments", tone: "text-sky-500" },
    { icon: UsersRound, label: "Team", tone: "text-rose-500" },
    { icon: ShieldCheck, label: "Secure", tone: "text-cyan-500" },
  ] as const;

  return (
    <div className="relative min-h-[calc(100vh-7.2rem)] w-full py-2 md:min-h-[calc(100vh-6.4rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_46%_at_12%_10%,hsl(var(--primary)/0.13)_0%,transparent_72%),radial-gradient(45%_38%_at_84%_14%,hsl(198_78%_64%/0.10)_0%,transparent_78%)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-7">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/72 p-5 shadow-lg shadow-primary/5 backdrop-blur-sm lg:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[hsl(198_78%_64%/0.14)] blur-3xl"
          />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Ticket className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <Badge variant="outline" className="h-8 w-8 rounded-full p-0 text-primary" aria-label="Live workspace">
                <Activity className="h-4 w-4" aria-hidden />
              </Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-[1.95rem] md:leading-[1.08]">
                Ship quality with a clear issue workflow
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Track, triage, and ship with one focused workspace.
              </p>
            </div>
            <div className="rounded-xl border border-border/65 bg-background/72 p-3 shadow-sm">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {quickSignals.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.label}
                      tone="soft"
                      density="dense"
                      className="border-border/55 bg-card/90"
                      aria-label={item.label}
                      title={item.label}
                    >
                      <CardContent className="flex h-11 items-center justify-center p-0">
                        <Icon className={`h-4.5 w-4.5 ${item.tone}`} aria-hidden />
                        <span className="sr-only">{item.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="h-8 w-8 rounded-full p-0" aria-label="Modern shell" title="Modern shell">
                <Ticket className="h-4 w-4" aria-hidden />
              </Badge>
              <Badge variant="outline" className="h-8 w-8 rounded-full p-0" aria-label="Consistent system" title="Consistent system">
                <Workflow className="h-4 w-4" aria-hidden />
              </Badge>
              <Badge variant="outline" className="h-8 w-8 rounded-full p-0" aria-label="Team aligned" title="Team aligned">
                <UsersRound className="h-4 w-4" aria-hidden />
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex w-full justify-center lg:justify-end">{children}</div>
      </div>
    </div>
  );
}

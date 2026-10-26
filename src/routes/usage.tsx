import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { MessageSquare, Brain, ImageIcon, BookOpen, Wand2, Zap } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { listUsage, type UsageEvent, type UsageKind } from "@/lib/store";

export const Route = createFileRoute("/usage")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Usage · RunWork" },
      { name: "description", content: "Track your RunWork activity: messages, deep thinking, images and journaling." },
      { property: "og:title", content: "Usage · RunWork" },
      { property: "og:description", content: "Your RunWork activity at a glance." },
    ],
  }),
  component: Usage,
});

const KINDS: { kind: UsageKind; label: string; icon: typeof Zap }[] = [
  { kind: "message", label: "Messages", icon: MessageSquare },
  { kind: "think", label: "Deep thinking", icon: Brain },
  { kind: "image", label: "Images", icon: ImageIcon },
  { kind: "journal", label: "Journal entries", icon: BookOpen },
  { kind: "reflect", label: "Reflections", icon: Wand2 },
];

function Usage() {
  const { user, ready } = useAuth();
  const [range, setRange] = useState<7 | 30>(7);
  const [events, setEvents] = useState<UsageEvent[] | null>(null);

  useEffect(() => {
    if (ready) listUsage(user, 30).then(setEvents).catch((e) => toast.error(e.message));
  }, [user, ready]);

  const { days, total, prevTotal, byKind, todayIdx } = useMemo(() => {
    const ev = events ?? [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(start.getTime() - (range - 1 - i) * 864e5);
      return { key: d.toDateString(), label: range === 7 ? d.toLocaleDateString(undefined, { weekday: "short" }) : String(d.getDate()), count: 0 };
    });
    const map = new Map(days.map((d) => [d.key, d]));
    const cutoff = start.getTime() - (range - 1) * 864e5;
    const byKind: Record<string, number> = {};
    let total = 0, prevTotal = 0;
    for (const e of ev) {
      const t = new Date(e.created_at).getTime();
      if (t >= cutoff) {
        total++;
        byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
        const d = map.get(new Date(e.created_at).toDateString());
        if (d) d.count++;
      } else if (t >= cutoff - range * 864e5) prevTotal++;
    }
    return { days, total, prevTotal, byKind, todayIdx: days.length - 1 };
  }, [events, range]);

  const change = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  return (
    <AppShell>
      <PageHeader
        title="Usage"
        subtitle={user ? "Synced across your devices." : "Tracked in this browser. Sign in to sync."}
        actions={
          <div className="flex rounded-full bg-secondary p-1 text-sm">
            {([7, 30] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-full px-4 py-1.5 ${range === r ? "bg-card shadow-soft font-medium" : "text-muted-foreground"}`}>
                {r === 7 ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 px-6 pb-10 sm:px-10 lg:grid-cols-3">
        <div className="rounded-4xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-5xl font-semibold">{total}<span className="ml-1 text-lg text-muted-foreground">actions</span></p>
              <p className="mt-1 text-sm text-muted-foreground">
                {change === null ? "No earlier activity to compare yet" : `${change >= 0 ? "Up" : "Down"} ${Math.abs(change)}% vs previous ${range} days`}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground"><Zap className="size-5" /></div>
          </div>
          <div className="mt-6 h-64">
            {events === null ? null : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                  <Bar dataKey="count" name="Actions" radius={[10, 10, 10, 10]}>
                    {days.map((_, i) => <Cell key={i} fill={i === todayIdx ? "var(--brand)" : "var(--chart-4)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-4xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-semibold">Per-feature usage</h2>
          <ul className="space-y-3">
            {KINDS.map((k) => {
              const n = byKind[k.kind] ?? 0;
              return (
                <li key={k.kind} className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand"><k.icon className="size-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{k.label}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-brand" style={{ width: total ? `${(n / total) * 100}%` : "0%" }} />
                    </div>
                  </div>
                  <span className="font-display text-lg font-semibold">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

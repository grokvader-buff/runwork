import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AgentAvatar } from "@/components/chat-window";
import { useAuth } from "@/hooks/use-auth";
import { createThread } from "@/lib/store";
import { notifyThreads } from "@/components/thread-list";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents · RunWork" },
      { name: "description", content: "Meet RunWork's built-in agents: Brain Zero and Butler." },
      { property: "og:title", content: "Agents · RunWork" },
      { property: "og:description", content: "Built-in AI agents for everyday tasks and deep work." },
    ],
  }),
  component: Agents,
});

const AGENTS = [
  {
    id: "butler",
    name: "Butler",
    tag: "Everyday tasks",
    desc: "Accurate, smart and efficient. Butler turns what you need into plans, checklists, drafts and decisions you can act on right away.",
    traits: ["Plans & schedules", "Emails & messages", "Lists & decisions", "Double-checks facts"],
  },
  {
    id: "brain-zero",
    name: "Brain Zero",
    tag: "Core intelligence",
    desc: "RunWork's main brain for coding, writing and long, careful thinking. Switch on Think longer for hard problems.",
    traits: ["Code & debugging", "Writing & editing", "Deep reasoning", "Explanations"],
  },
];

function Agents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <AppShell>
      <PageHeader title="Agents" subtitle="Built-in helpers, each tuned for a different kind of work." />
      <div className="grid gap-4 px-6 pb-10 sm:px-10 lg:grid-cols-2">
        {AGENTS.map((a) => (
          <div key={a.id} className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <AgentAvatar agent={a.id} className="size-14" />
              <div>
                <h2 className="text-xl font-semibold">{a.name}</h2>
                <p className="text-xs font-medium uppercase tracking-wider text-brand">{a.tag}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{a.desc}</p>
            <ul className="grid grid-cols-2 gap-2">
              {a.traits.map((t) => (
                <li key={t} className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm"><Check className="size-3.5 text-brand" />{t}</li>
              ))}
            </ul>
            <button
              className="mt-auto flex items-center justify-between rounded-full bg-primary py-2 pl-5 pr-2 text-sm font-medium text-primary-foreground"
              onClick={async () => {
                try {
                  const id = await createThread(user, a.id);
                  notifyThreads();
                  navigate({ to: "/chat/$threadId", params: { threadId: id } });
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Chat with {a.name}
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground"><ArrowRight className="size-4" /></span>
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

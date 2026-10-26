import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, PenLine, BookOpen, ImageIcon, Brain } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ThreadList, notifyThreads } from "@/components/thread-list";
import { FlipClock } from "@/components/flip-clock";
import { AgentAvatar } from "@/components/chat-window";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit, PromptInputTools, PromptInputButton } from "@/components/ai-elements/prompt-input";
import { useAuth, displayName } from "@/hooks/use-auth";
import { createThread } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunWork — your AI workspace" },
      { name: "description", content: "Chat with Brain Zero and Butler to code, write, journal, create images and think deeply." },
      { property: "og:title", content: "RunWork — your AI workspace" },
      { property: "og:description", content: "The easiest way to get tasks and work done." },
    ],
  }),
  component: Home,
});

const QUICK = [
  { icon: Code2, label: "Code", hint: "Build, debug, explain", prompt: "Help me write code: " },
  { icon: PenLine, label: "Write", hint: "Drafts, emails, stories", prompt: "Help me write " },
  { icon: BookOpen, label: "Journal", hint: "Reflect on your day", to: "/journal" as const },
  { icon: ImageIcon, label: "Image", hint: "Create any picture", to: "/images" as const },
  { icon: Brain, label: "Think deeply", hint: "Long, careful reasoning", prompt: "", think: true },
];

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [think, setThink] = useState(false);
  const [busy, setBusy] = useState(false);

  const start = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const id = await createThread(user, "brain-zero");
      sessionStorage.setItem(`rw:pending:${id}`, JSON.stringify({ text, think }));
      notifyThreads();
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <AppShell aside={<ThreadList />}>
      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-10">
        <FlipClock size="lg" />
        <div className="flex flex-col items-center gap-3 text-center">
          <AgentAvatar agent="brain-zero" className="size-14" />
          <h1 className="text-3xl font-semibold sm:text-4xl">Hello {displayName(user)}</h1>
          <p className="text-muted-foreground">What should we get done today?</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                if (q.to) return navigate({ to: q.to });
                if (q.think) setThink(true);
                if (q.prompt) setInput(q.prompt);
                document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
              }}
              className={`flex flex-col items-start gap-3 rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift ${q.think && think ? "border-brand bg-brand-soft" : "border-border bg-card"}`}
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-secondary"><q.icon className="size-4 text-brand" /></div>
              <div>
                <p className="text-sm font-semibold">{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.hint}</p>
              </div>
            </button>
          ))}
        </div>
        <PromptInput onSubmit={(m) => start(m.text)} className="w-full rounded-3xl shadow-lift">
          <PromptInputTextarea autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Brain Zero anything…" />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton onClick={() => setThink((t) => !t)} className={think ? "bg-brand-soft text-brand" : ""} aria-pressed={think}>
                <Brain className="size-4" /> Think longer
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit status={busy ? "submitted" : undefined} disabled={!input.trim() || busy} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90" />
          </PromptInputFooter>
        </PromptInput>
        {!user && <p className="text-xs text-muted-foreground">You're a guest — chats are saved in this browser. Sign in to sync and share.</p>}
      </div>
    </AppShell>
  );
}

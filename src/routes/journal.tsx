import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { MessageResponse } from "@/components/ai-elements/message";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { deleteJournal, listJournal, trackUsage, upsertJournal, type JournalEntry } from "@/lib/store";

export const Route = createFileRoute("/journal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Journal · RunWork" },
      { name: "description", content: "Write daily journal entries and get gentle AI reflections." },
      { property: "og:title", content: "Journal · RunWork" },
      { property: "og:description", content: "Your private journal with AI reflections." },
    ],
  }),
  component: Journal,
});

function Journal() {
  const { user, ready } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reflection, setReflection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reflecting, setReflecting] = useState(false);

  const load = () => listJournal(user).then(setEntries).catch((e) => toast.error(e.message));
  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready]);

  const open = (e: JournalEntry | null) => {
    setActiveId(e?.id ?? null);
    setTitle(e?.title ?? "");
    setBody(e?.body ?? "");
    setReflection(e?.reflection ?? null);
  };

  const save = async (extra?: { reflection: string }) => {
    if (!body.trim() && !title.trim()) return toast("Write something first");
    setSaving(true);
    try {
      const isNew = !activeId;
      const id = await upsertJournal(user, { id: activeId ?? undefined, title: title || new Date().toLocaleDateString(undefined, { dateStyle: "long" }), body, ...(extra ?? {}) });
      if (isNew) trackUsage(user, "journal");
      setActiveId(id);
      await load();
      if (!extra) toast.success("Saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reflect = async () => {
    if (!body.trim()) return toast("Write your entry first");
    setReflecting(true);
    setReflection("");
    try {
      const res = await fetch("/api/reflect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `${title}\n\n${body}` }) });
      if (!res.ok || !res.body) throw new Error(res.status === 402 ? "AI credits are used up." : res.status === 429 ? "Busy — try again shortly." : "Couldn't reflect right now.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setReflection(acc);
      }
      trackUsage(user, "reflect");
      await save({ reflection: acc });
    } catch (e) {
      toast.error((e as Error).message);
      setReflection(null);
    } finally {
      setReflecting(false);
    }
  };

  return (
    <AppShell
      aside={
        <div className="flex h-full flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Journal</h2>
            <button aria-label="New entry" onClick={() => open(null)} className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-soft"><Plus className="size-4" /></button>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {entries.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">No entries yet.</p>}
            {entries.map((e) => (
              <button key={e.id} onClick={() => open(e)} className={`w-full rounded-xl px-3 py-2.5 text-left ${e.id === activeId ? "bg-secondary" : "hover:bg-secondary/60"}`}>
                <p className="truncate text-sm font-medium">{e.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { dateStyle: "full" })}</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title your day" className="bg-transparent font-display text-3xl font-semibold outline-none placeholder:text-muted-foreground/50" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's on your mind?" className="min-h-[320px] resize-none rounded-3xl bg-secondary p-5 text-base leading-relaxed outline-none" />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" className="rounded-full" onClick={() => save()} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />}Save entry</Button>
          <Button variant="accent" onClick={reflect} disabled={reflecting}>{reflecting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}Ask RunWork to reflect</Button>
          {activeId && (
            <>
              <ShareButton kind="journal" title={title || "Journal entry"} getPayload={() => ({ body, reflection })} />
              <Button variant="ghost" className="rounded-full text-destructive" onClick={async () => { await deleteJournal(user, activeId).catch((e) => toast.error(e.message)); open(null); load(); }}>
                <Trash2 className="size-4" /> Delete
              </Button>
            </>
          )}
        </div>
        {reflection !== null && (
          <div className="rounded-3xl border border-brand/30 bg-brand-soft p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">Reflection</p>
            {reflection ? <MessageResponse>{reflection}</MessageResponse> : <p className="text-sm text-muted-foreground">Reading your entry…</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}

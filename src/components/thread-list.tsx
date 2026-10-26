import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { createThread, deleteThread, listThreads, type Thread } from "@/lib/store";

export const THREADS_CHANGED = "rw:threads-changed";
export const notifyThreads = () => window.dispatchEvent(new Event(THREADS_CHANGED));

export function ThreadList({ activeId }: { activeId?: string }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!ready) return;
    const load = () => listThreads(user).then(setThreads).catch((e) => toast.error(e.message));
    load();
    window.addEventListener(THREADS_CHANGED, load);
    return () => window.removeEventListener(THREADS_CHANGED, load);
  }, [user, ready]);

  const filtered = (threads ?? []).filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Messages</h2>
        <button
          aria-label="New chat"
          className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-soft"
          onClick={async () => {
            try {
              const id = await createThread(user, "brain-zero");
              notifyThreads();
              navigate({ to: "/chat/$threadId", params: { threadId: id } });
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {threads && filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{q ? "No matches" : "No chats yet. Start one!"}</p>
        )}
        {filtered.map((t) => (
          <div key={t.id} className={`group flex items-center rounded-xl ${t.id === activeId ? "bg-secondary" : "hover:bg-secondary/60"}`}>
            <Link to="/chat/$threadId" params={{ threadId: t.id }} className="min-w-0 flex-1 px-3 py-2.5">
              <p className="truncate text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.agent === "butler" ? "Butler" : "Brain Zero"} · {new Date(t.updated_at).toLocaleDateString()}
              </p>
            </Link>
            <button
              aria-label="Delete chat"
              className="mr-2 rounded-lg p-1.5 text-muted-foreground opacity-0 hover:bg-background group-hover:opacity-100"
              onClick={async () => {
                await deleteThread(user, t.id).catch((e) => toast.error(e.message));
                notifyThreads();
                if (t.id === activeId) navigate({ to: "/" });
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

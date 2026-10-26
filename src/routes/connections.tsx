import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, MessageSquare, BookOpen, ImageIcon, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { deleteShare, listShares, shareUrl, type Share } from "@/lib/store";

export const Route = createFileRoute("/connections")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connections · RunWork" },
      { name: "description", content: "Share chats, journal entries and images with your friends." },
      { property: "og:title", content: "Connections · RunWork" },
      { property: "og:description", content: "RunWork's job is better with connections." },
    ],
  }),
  component: Connections,
});

const ICON = { chat: MessageSquare, journal: BookOpen, image: ImageIcon } as Record<string, typeof Users>;

function Connections() {
  const { user, ready } = useAuth();
  const [shares, setShares] = useState<Share[] | null>(null);
  useEffect(() => {
    if (ready && user) listShares().then(setShares).catch((e) => toast.error(e.message));
  }, [user, ready]);

  return (
    <AppShell>
      <PageHeader title="Connections" subtitle="RunWork's job is better with connections — share anything with your friends." />
      <div className="px-6 pb-10 sm:px-10">
        {!user ? (
          <div className="flex flex-col items-center gap-4 rounded-4xl border border-border bg-card p-10 text-center shadow-soft">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand"><Users className="size-6" /></div>
            <p className="max-w-sm text-muted-foreground">Sign in to create share links your friends can open — chats, journal entries and images.</p>
            <Link to="/auth" className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Sign in</Link>
          </div>
        ) : shares && shares.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing shared yet. Use the Share button on any chat, journal entry or image.
          </div>
        ) : (
          <div className="grid gap-3">
            {(shares ?? []).map((s) => {
              const Icon = ICON[s.kind] ?? Users;
              return (
                <div key={s.id} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{s.kind} · shared {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <button aria-label="Copy link" className="rounded-full p-2 hover:bg-secondary" onClick={() => navigator.clipboard.writeText(shareUrl(s.id)).then(() => toast.success("Link copied"))}><Copy className="size-4" /></button>
                  <a aria-label="Open" href={`/s/${s.id}`} target="_blank" rel="noreferrer" className="rounded-full p-2 hover:bg-secondary"><ExternalLink className="size-4" /></a>
                  <button aria-label="Stop sharing" className="rounded-full p-2 text-muted-foreground hover:bg-secondary" onClick={async () => { await deleteShare(s.id).catch((e) => toast.error(e.message)); setShares((p) => (p ?? []).filter((x) => x.id !== s.id)); toast("Sharing stopped"); }}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

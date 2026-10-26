import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ThreadList } from "@/components/thread-list";
import { ChatWindow } from "@/components/chat-window";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useAuth } from "@/hooks/use-auth";
import { getThread, type Thread } from "@/lib/store";

export const Route = createFileRoute("/chat/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat · RunWork" },
      { name: "description", content: "A conversation in RunWork." },
      { property: "og:title", content: "Chat · RunWork" },
      { property: "og:description", content: "A conversation in RunWork." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const { user, ready } = useAuth();
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    setThread(undefined);
    getThread(user, threadId).then(setThread).catch(() => setThread(null));
  }, [threadId, user, ready]);

  return (
    <AppShell aside={<ThreadList activeId={threadId} />}>
      {thread === undefined ? (
        <div className="p-10"><Shimmer>Loading chat…</Shimmer></div>
      ) : thread === null ? (
        <div className="flex flex-col items-center gap-3 p-16 text-center">
          <p className="font-display text-xl font-semibold">Chat not found</p>
          <Link to="/" className="text-sm text-brand underline">Start a new one</Link>
        </div>
      ) : (
        <ChatWindow key={thread.id} threadId={thread.id} agent={thread.agent} title={thread.title} initialMessages={thread.messages} />
      )}
    </AppShell>
  );
}

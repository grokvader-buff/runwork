import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Brain, Copy, ConciergeBell } from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse, MessageActions, MessageAction } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit, PromptInputTools, PromptInputButton } from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useAuth } from "@/hooks/use-auth";
import { saveThread, trackUsage } from "@/lib/store";
import { notifyThreads } from "@/components/thread-list";
import { ShareButton } from "@/components/share-button";
import { FlipClock } from "@/components/flip-clock";
import { Logo } from "@/components/app-shell";

export const AGENT_LABEL: Record<string, string> = { "brain-zero": "Brain Zero", butler: "Butler" };

export function AgentAvatar({ agent, className = "size-8" }: { agent: string; className?: string }) {
  if (agent === "butler")
    return (
      <div className={`flex items-center justify-center rounded-full bg-brand text-brand-foreground ${className}`}>
        <ConciergeBell className="size-1/2" />
      </div>
    );
  return (
    <div className={`overflow-hidden rounded-full border border-border bg-card p-1 ${className}`}>
      <Logo className="size-full" />
    </div>
  );
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function ChatWindow({
  threadId,
  agent,
  title,
  initialMessages,
}: {
  threadId: string;
  agent: string;
  title: string;
  initialMessages: UIMessage[];
}) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [think, setThink] = useState(false);
  const titleRef = useRef(title);
  const thinkRef = useRef(think);
  thinkRef.current = think;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "Something went wrong"),
    onFinish: async ({ messages: all }) => {
      try {
        const firstUser = all.find((m) => m.role === "user");
        const patch: { messages: UIMessage[]; title?: string } = { messages: all };
        if (titleRef.current === "New chat" && firstUser) {
          titleRef.current = textOf(firstUser).slice(0, 60) || "New chat";
          patch.title = titleRef.current;
        }
        await saveThread(user, threadId, patch);
        notifyThreads();
      } catch (e) {
        toast.error(`Couldn't save chat: ${(e as Error).message}`);
      }
      textareaRef.current?.focus();
    },
  });

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text }, { body: { agent, think: thinkRef.current } });
    trackUsage(user, thinkRef.current ? "think" : "message");
    setInput("");
  };

  // Pending message from the home screen
  useEffect(() => {
    const key = `rw:pending:${threadId}`;
    const pending = sessionStorage.getItem(key);
    if (pending) {
      sessionStorage.removeItem(key);
      const { text, think: t } = JSON.parse(pending) as { text: string; think: boolean };
      thinkRef.current = t;
      setThink(t);
      send(text);
    }
    textareaRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <AgentAvatar agent={agent} />
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{titleRef.current}</p>
            <p className="text-xs text-muted-foreground">{AGENT_LABEL[agent] ?? "Brain Zero"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><FlipClock /></div>
          {messages.length > 0 && (
            <ShareButton kind="chat" title={titleRef.current} getPayload={() => ({ agent, messages: messages.map((m) => ({ role: m.role, text: textOf(m) })) })} />
          )}
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AgentAvatar agent={agent} className="size-16" />
              <h2 className="text-2xl font-semibold">{agent === "butler" ? "Butler at your service" : "What are we working on?"}</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                {agent === "butler" ? "Plans, emails, lists, schedules — tell Butler what needs doing." : "Code, write, plan or think it through with Brain Zero."}
              </p>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground group-[.is-user]:rounded-3xl">
                {m.parts.map((p, i) => {
                  if (p.type === "reasoning")
                    return (
                      <Reasoning key={i} isStreaming={status === "streaming" && i === m.parts.length - 1}>
                        <ReasoningTrigger />
                        <ReasoningContent>{p.text}</ReasoningContent>
                      </Reasoning>
                    );
                  if (p.type === "text") return m.role === "user" ? <p key={i} className="whitespace-pre-wrap">{p.text}</p> : <MessageResponse key={i}>{p.text}</MessageResponse>;
                  return null;
                })}
              </MessageContent>
              {m.role === "assistant" && textOf(m) && (
                <MessageActions>
                  <MessageAction label="Copy" tooltip="Copy" onClick={() => navigator.clipboard.writeText(textOf(m)).then(() => toast.success("Copied"))}>
                    <Copy className="size-3.5" />
                  </MessageAction>
                </MessageActions>
              )}
            </Message>
          ))}
          {status === "submitted" && (
            <div className="py-2"><Shimmer>{think ? "Thinking deeply…" : "Thinking…"}</Shimmer></div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-6 pb-6">
        <PromptInput onSubmit={(msg) => send(msg.text)} className="rounded-3xl shadow-lift">
          <PromptInputTextarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${AGENT_LABEL[agent] ?? "Brain Zero"}…`} />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton
                onClick={() => setThink((t) => !t)}
                className={think ? "bg-brand-soft text-brand" : ""}
                aria-pressed={think}
              >
                <Brain className="size-4" /> Think longer
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90" />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

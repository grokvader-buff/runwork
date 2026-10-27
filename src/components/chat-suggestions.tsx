import { Button } from "@/components/ui/button";
const suggestions = [
  { label: "Write", prompt: "Help me write " },
  { label: "Code", prompt: "Help me write code: " },
  { label: "Research", prompt: "Research " },
  { label: "Reflect", prompt: "Help me reflect on " },
  { label: "Plan", prompt: "Help me plan " },
];
export function ChatSuggestions({ input, onSelect }: { input: string; onSelect: (text: string) => void }) {
  return <div className="mt-4 flex flex-wrap justify-center gap-1.5">{suggestions.map((s) => <Button key={s.label} type="button" size="sm" variant="ghost" aria-pressed={input.toLowerCase().startsWith(s.prompt.toLowerCase())} className={`rounded-full px-4 text-xs transition-all ${input.toLowerCase().startsWith(s.prompt.toLowerCase()) ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary"}`} onClick={() => onSelect(s.prompt)}>{s.label}</Button>)}</div>;
}
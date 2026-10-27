import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
const colors = ["graphite", "mint", "rose", "blue", "violet"] as const;
export function AccentBootstrap() {
  useEffect(() => { const saved = localStorage.getItem("rw:accent"); if (saved && colors.some((c) => c === saved)) document.documentElement.dataset.accent = saved; }, []);
  return null;
}
export function ColorSettings() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("graphite");
  useEffect(() => { setSelected(localStorage.getItem("rw:accent") ?? "graphite"); }, []);
  return <div className="relative">
    <Button variant="ghost" size="icon" aria-label="Color settings" title="Color settings" onClick={() => setOpen(!open)}><Palette /></Button>
    {open && <div className="absolute right-0 bottom-full z-40 mb-2 w-56 rounded-lg border border-border bg-popover p-4 shadow-lift"><p className="mb-3 text-sm font-medium">Accent color</p><div className="flex gap-2">{colors.map((c) => <Button key={c} size="icon-sm" variant="ghost" aria-label={c} aria-pressed={selected === c} title={c} className={`accent-swatch swatch-${c} rounded-full`} onClick={() => { setSelected(c); document.documentElement.dataset.accent = c; localStorage.setItem("rw:accent", c); }}>{selected === c && <Check className="size-3" />}</Button>)}</div></div>}
  </div>;
}
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { EFFORTS, effortFromIndex, type Effort } from "@/lib/effort";

export function EffortControl({ value, onChange }: { value: Effort; onChange: (value: Effort) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="relative min-w-0">
    <Button type="button" variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)} className={value === "Max" ? "effort-max" : "text-muted-foreground"}>
      Effort <span className="text-foreground">{value}</span><ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} />
    </Button>
    {open && <div className="absolute bottom-full left-0 z-30 mb-3 w-64 rounded-lg border border-border bg-popover p-5 shadow-lift">
      <Slider aria-label="Effort" min={0} max={3} step={1} value={[EFFORTS.indexOf(value)]} onValueChange={([index]) => onChange(effortFromIndex(index ?? 0))} />
      <div className="mt-4 flex justify-between text-xs text-muted-foreground">{EFFORTS.map((level) => <span key={level} className={level === value ? (level === "Max" ? "effort-max font-semibold" : "text-foreground font-semibold") : ""}>{level}</span>)}</div>
    </div>}
  </div>;
}
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function FlipDigit({ value, size }: { value: string; size: "sm" | "lg" }) {
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);
  useEffect(() => {
    if (value === prev) return;
    setFlipping(true);
    const t = setTimeout(() => {
      setPrev(value);
      setFlipping(false);
    }, 500);
    return () => clearTimeout(t);
  }, [value, prev]);

  const box =
    size === "lg" ? "h-24 w-16 text-6xl sm:h-28 sm:w-20 sm:text-7xl" : "h-9 w-6 text-xl";
  const half = "absolute inset-x-0 overflow-hidden bg-flip";
  return (
    <div className={cn("relative rounded-xl font-display font-semibold text-flip-foreground [perspective:400px]", box)}>
      {/* static top shows new value, bottom shows old until flip */}
      <div className={cn(half, "top-0 h-1/2 rounded-t-xl border-b border-border")}>
        <span className="absolute inset-x-0 top-0 flex h-[200%] items-center justify-center">{value}</span>
      </div>
      <div className={cn(half, "bottom-0 h-1/2 rounded-b-xl shadow-soft")}>
        <span className="absolute inset-x-0 bottom-0 flex h-[200%] items-center justify-center">{flipping ? prev : value}</span>
      </div>
      {flipping && (
        <>
          <div className={cn(half, "top-0 h-1/2 rounded-t-xl flip-top-anim border-b border-border")}>
            <span className="absolute inset-x-0 top-0 flex h-[200%] items-center justify-center">{prev}</span>
          </div>
          <div className={cn(half, "bottom-0 h-1/2 rounded-b-xl flip-bottom-anim")}>
            <span className="absolute inset-x-0 bottom-0 flex h-[200%] items-center justify-center">{value}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function FlipClock({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  if (!now) return <div className={cn(size === "lg" ? "h-28" : "h-9", className)} />;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const h = now.getHours();
  const hh = String(h % 12 || 12).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const groups = [hh, mm, ss];
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn("flex items-center", size === "lg" ? "gap-3" : "gap-1")}>
        {groups.map((g, gi) => (
          <div key={gi} className={cn("flex items-center", size === "lg" ? "gap-1.5" : "gap-0.5")}>
            {g.split("").map((d, di) => (
              <FlipDigit key={di} value={d} size={size} />
            ))}
            {gi < 2 && <span className={cn("font-display text-muted-foreground", size === "lg" ? "px-1 text-5xl" : "text-lg")}>:</span>}
          </div>
        ))}
        <span className={cn("font-display font-semibold text-brand", size === "lg" ? "ml-2 text-xl" : "ml-1 text-xs")}>
          {h >= 12 ? "PM" : "AM"}
        </span>
      </div>
      {size === "lg" && (
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · {tz.replace(/_/g, " ")}
        </p>
      )}
    </div>
  );
}

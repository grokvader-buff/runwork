import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Loader2, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useAuth } from "@/hooks/use-auth";
import { deleteImage, listImages, saveImage, trackUsage, type ImageItem } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/images")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Images · RunWork" },
      { name: "description", content: "Generate images from a description with RunWork." },
      { property: "og:title", content: "Images · RunWork" },
      { property: "og:description", content: "Describe it, and RunWork draws it." },
    ],
  }),
  component: Images,
});

function Images() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready) listImages(user).then(setItems).catch((e) => toast.error(e.message));
  }, [user, ready]);

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = (await res.json()) as { b64?: string | null; url?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      let b64 = data.b64;
      if (!b64 && data.url) {
        const blob = await (await fetch(data.url)).blob();
        b64 = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
      }
      const item = await saveImage(user, prompt, b64!);
      trackUsage(user, "image");
      setItems((p) => [item, ...p]);
      setPrompt("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Images" subtitle="Describe anything and RunWork will create it." />
      <div className="px-6 sm:px-10">
        <div className="flex flex-col gap-3 rounded-4xl border border-border bg-card p-3 shadow-lift sm:flex-row">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="A cozy white studio with morning light, minimalist desk, orange accents…"
            className="min-h-[56px] flex-1 resize-none bg-transparent p-3 outline-none"
          />
          <Button variant="accent" size="lg" onClick={generate} disabled={busy || !prompt.trim()} className="self-end sm:self-center">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} Generate
          </Button>
        </div>
      </div>
      <div className="grid gap-4 px-6 py-8 sm:grid-cols-2 sm:px-10 xl:grid-cols-3">
        {busy && (
          <div className="flex aspect-square items-center justify-center rounded-3xl bg-secondary"><Shimmer>Creating your image…</Shimmer></div>
        )}
        {!busy && items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Your creations will appear here.</p>}
        {items.map((it) => (
          <figure key={it.id} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <img src={it.src} alt={it.prompt} className="aspect-square w-full object-cover" loading="lazy" />
            <figcaption className="flex items-center gap-2 p-3">
              <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{it.prompt}</p>
              <a href={it.src} download="runwork-image.png" aria-label="Download" className="rounded-full p-2 hover:bg-secondary"><Download className="size-4" /></a>
              <ShareButton
                kind="image"
                size="icon-sm"
                title={it.prompt.slice(0, 60)}
                getPayload={() => ({ prompt: it.prompt, path: it.path })}
              />
              <button aria-label="Delete" className="rounded-full p-2 text-muted-foreground hover:bg-secondary" onClick={async () => { await deleteImage(user, it).catch((e) => toast.error(e.message)); setItems((p) => p.filter((x) => x.id !== it.id)); }}>
                <Trash2 className="size-4" />
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </AppShell>
  );
}

export { supabase };

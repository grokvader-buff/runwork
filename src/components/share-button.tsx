import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createShare, shareUrl } from "@/lib/store";

export function ShareButton({
  kind,
  title,
  getPayload,
  size = "sm",
  label = "Share",
}: {
  kind: "chat" | "journal" | "image";
  title: string;
  getPayload: () => unknown;
  size?: "sm" | "icon-sm";
  label?: string;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="soft"
      size={size}
      disabled={busy}
      aria-label={label}
      onClick={async () => {
        if (!user) {
          toast("Sign in to share with friends", { description: "Share links need a RunWork account." });
          return;
        }
        setBusy(true);
        try {
          const id = await createShare(user, kind, title, getPayload());
          const url = shareUrl(id);
          if (navigator.share) {
            await navigator.share({ title: `${title} · RunWork`, url }).catch(() => navigator.clipboard.writeText(url));
          } else {
            await navigator.clipboard.writeText(url);
          }
          toast.success("Share link copied", { description: url });
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      {size === "sm" && label}
    </Button>
  );
}

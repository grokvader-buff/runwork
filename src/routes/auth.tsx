import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/app-shell";
import { FlipClock } from "@/components/flip-clock";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · RunWork" },
      { name: "description", content: "Sign in to RunWork to sync your chats, journal and images." },
      { property: "og:title", content: "Sign in · RunWork" },
      { property: "og:description", content: "Sign in to sync and share your work." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Sign in failed");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md glass-card p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo className="size-20" />
          <h1 className="text-2xl font-semibold">{mode === "in" ? "Welcome back to RunWork" : "Create your RunWork account"}</h1>
          <FlipClock />
        </div>
        {sent ? (
          <p className="rounded-2xl bg-brand-soft p-4 text-center text-sm">Check your email to confirm your account, then come back to sign in.</p>
        ) : (
          <>
            <div className="space-y-2">
              <button type="button" onClick={() => oauth("google")} className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm font-medium hover:bg-secondary">
                Continue with Google
              </button>
              <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
            </div>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "up" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none" />}
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none" />
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm outline-none" />
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-soft">
                {busy && <Loader2 className="size-4 animate-spin" />}{mode === "in" ? "Sign in" : "Create account"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "in" ? "New to RunWork?" : "Already have an account?"}{" "}
              <button className="font-medium text-brand" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create one" : "Sign in"}</button>
            </p>
          </>
        )}
        <button onClick={() => navigate({ to: "/" })} className="mt-4 w-full text-center text-xs text-muted-foreground underline">Continue as guest</button>
      </div>
    </div>
  );
}

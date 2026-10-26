import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MessageSquare, Bot, BookOpen, ImageIcon, BarChart3, Share2, LogIn, LogOut } from "lucide-react";
import logo from "@/assets/runwork-logo.jpg.asset.json";
import { useAuth, displayName } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FlipClock } from "@/components/flip-clock";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Chat", icon: MessageSquare },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/images", label: "Images", icon: ImageIcon },
  { to: "/usage", label: "Usage", icon: BarChart3 },
  { to: "/connections", label: "Connections", icon: Share2 },
] as const;

export function Logo({ className }: { className?: string }) {
  return <img src={logo.url} alt="RunWork" className={cn("object-contain mix-blend-multiply", className)} />;
}

export function AppShell({ children, aside, header }: { children: ReactNode; aside?: ReactNode; header?: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-surface p-3 gap-3">
      <nav className="hidden w-56 shrink-0 flex-col glass-card p-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-1">
          <Logo className="size-10" />
          <span className="font-display text-lg font-semibold">RunWork</span>
        </Link>
        <div className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl bg-secondary p-3">
            <FlipClock />
          </div>
          {user ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border p-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                {displayName(user).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName(user)}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                aria-label="Sign out"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              <LogIn className="size-4" /> Sign in to sync
            </Link>
          )}
        </div>
      </nav>
      {aside && <aside className="hidden w-72 shrink-0 flex-col glass-card lg:flex">{aside}</aside>}
      <main className="flex min-w-0 flex-1 flex-col glass-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <Logo className="size-7" />
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="rounded-lg p-2 text-muted-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground">
                <n.icon className="size-4" />
              </Link>
            ))}
          </div>
        </div>
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-8 pb-6 sm:px-10">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

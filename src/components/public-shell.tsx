import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ColorSettings } from "@/components/color-settings";
const links = [{ to: "/", label: "Home" }, { to: "/pricing", label: "Pricing" }, { to: "/group", label: "Group" }, { to: "/resources", label: "Resources" }, { to: "/contacts", label: "Contacts" }] as const;
export function PublicShell({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background">
    <header className="public-nav sticky top-0 z-40 border-b border-border/50"><div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:flex sm:justify-between sm:px-8">
      <Link to="/" className="flex min-w-0 items-center gap-2"><Logo className="size-9" /><span className="font-display text-lg font-semibold">RunWork</span></Link>
      <nav className="order-3 col-span-2 flex gap-1 overflow-x-auto sm:order-none">{links.map((l) => <Button key={l.to} asChild variant="ghost" size="sm" className="nav-tan rounded-full px-4"><Link to={l.to} activeOptions={{ exact: true }} activeProps={{ className: "nav-selected" }}>{l.label}</Link></Button>)}</nav>
      <div className="flex shrink-0 items-center gap-1"><ColorSettings /><Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button><Button asChild size="sm" className="hidden rounded-full sm:inline-flex"><Link to="/auth">Get started</Link></Button></div>
    </div></header>
    {children}
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-8 text-xs text-muted-foreground"><span>RunWork. Make room for your next idea.</span><div className="flex gap-5"><Link to="/pricing">Pricing</Link><Link to="/resources">Resources</Link><Link to="/contacts">Contacts</Link></div></footer>
  </div>;
}
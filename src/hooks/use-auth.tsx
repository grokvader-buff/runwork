import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { user: User | null; ready: boolean };
const AuthContext = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, ready: true });
    });
    supabase.auth.getUser().then(({ data: d }) => setState({ user: d.user ?? null, ready: true }));
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function displayName(user: User | null) {
  if (!user) return "there";
  const m = user.user_metadata as Record<string, string | undefined>;
  return (m.full_name || m.name || user.email?.split("@")[0] || "there").split(" ")[0];
}

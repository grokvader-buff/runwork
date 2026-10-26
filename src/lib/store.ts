import type { UIMessage } from "ai";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Thread = { id: string; title: string; agent: string; messages: UIMessage[]; updated_at: string };
export type JournalEntry = { id: string; title: string; body: string; reflection: string | null; created_at: string; updated_at: string };
export type ImageItem = { id: string; prompt: string; src: string; path?: string; created_at: string };
export type UsageKind = "message" | "think" | "image" | "journal" | "reflect";
export type UsageEvent = { kind: UsageKind; created_at: string };
export type Share = { id: string; kind: string; title: string; payload: unknown; created_at: string };

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

function lsGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}
function lsSet<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("This browser's storage is full. Sign in to save to the cloud.");
  }
}
const K = { threads: "rw:threads", journal: "rw:journal", images: "rw:images", usage: "rw:usage" };

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// ---------- Threads ----------
export async function listThreads(user: User | null): Promise<Thread[]> {
  if (!user) return lsGet<Thread>(K.threads).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const data = check(
    await supabase.from("threads").select("id,title,agent,messages,updated_at").order("updated_at", { ascending: false }),
  );
  return (data ?? []).map((t) => ({ ...t, messages: (t.messages as unknown as UIMessage[]) ?? [] }));
}

export async function getThread(user: User | null, id: string): Promise<Thread | null> {
  if (!user) return lsGet<Thread>(K.threads).find((t) => t.id === id) ?? null;
  const data = check(await supabase.from("threads").select("id,title,agent,messages,updated_at").eq("id", id).maybeSingle());
  return data ? { ...data, messages: (data.messages as unknown as UIMessage[]) ?? [] } : null;
}

export async function createThread(user: User | null, agent: string): Promise<string> {
  if (!user) {
    const t: Thread = { id: uid(), title: "New chat", agent, messages: [], updated_at: now() };
    lsSet(K.threads, [t, ...lsGet<Thread>(K.threads)]);
    return t.id;
  }
  const data = check(await supabase.from("threads").insert({ user_id: user.id, agent }).select("id").single());
  return data.id;
}

export async function saveThread(user: User | null, id: string, patch: { title?: string; messages?: UIMessage[] }) {
  if (!user) {
    const all = lsGet<Thread>(K.threads).map((t) => (t.id === id ? { ...t, ...patch, updated_at: now() } : t));
    lsSet(K.threads, all);
    return;
  }
  check(
    await supabase
      .from("threads")
      .update({ ...patch, messages: patch.messages as never, updated_at: now() })
      .eq("id", id),
  );
}

export async function deleteThread(user: User | null, id: string) {
  if (!user) return lsSet(K.threads, lsGet<Thread>(K.threads).filter((t) => t.id !== id));
  check(await supabase.from("threads").delete().eq("id", id));
}

// ---------- Journal ----------
export async function listJournal(user: User | null): Promise<JournalEntry[]> {
  if (!user) return lsGet<JournalEntry>(K.journal).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return check(await supabase.from("journal_entries").select("*").order("created_at", { ascending: false })) ?? [];
}

export async function upsertJournal(
  user: User | null,
  entry: { id?: string; title: string; body: string; reflection?: string | null },
): Promise<string> {
  if (!user) {
    const all = lsGet<JournalEntry>(K.journal);
    if (entry.id) {
      lsSet(K.journal, all.map((e) => (e.id === entry.id ? { ...e, ...entry, updated_at: now() } as JournalEntry : e)));
      return entry.id;
    }
    const e: JournalEntry = { id: uid(), title: entry.title, body: entry.body, reflection: entry.reflection ?? null, created_at: now(), updated_at: now() };
    lsSet(K.journal, [e, ...all]);
    return e.id;
  }
  if (entry.id) {
    check(await supabase.from("journal_entries").update({ ...entry, updated_at: now() }).eq("id", entry.id));
    return entry.id;
  }
  const data = check(
    await supabase.from("journal_entries").insert({ user_id: user.id, title: entry.title, body: entry.body }).select("id").single(),
  );
  return data.id;
}

export async function deleteJournal(user: User | null, id: string) {
  if (!user) return lsSet(K.journal, lsGet<JournalEntry>(K.journal).filter((e) => e.id !== id));
  check(await supabase.from("journal_entries").delete().eq("id", id));
}

// ---------- Images ----------
function b64ToBlob(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

export async function listImages(user: User | null): Promise<ImageItem[]> {
  if (!user) return lsGet<ImageItem>(K.images).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const rows = check(await supabase.from("images").select("*").order("created_at", { ascending: false })) ?? [];
  if (rows.length === 0) return [];
  const signed = check(await supabase.storage.from("images").createSignedUrls(rows.map((r) => r.path), 60 * 60 * 24));
  return rows.map((r, i) => ({ id: r.id, prompt: r.prompt, path: r.path, src: signed?.[i]?.signedUrl ?? "", created_at: r.created_at }));
}

export async function saveImage(user: User | null, prompt: string, b64: string): Promise<ImageItem> {
  if (!user) {
    const item: ImageItem = { id: uid(), prompt, src: `data:image/png;base64,${b64}`, created_at: now() };
    lsSet(K.images, [item, ...lsGet<ImageItem>(K.images)]);
    return item;
  }
  const path = `${user.id}/${uid()}.png`;
  check(await supabase.storage.from("images").upload(path, b64ToBlob(b64), { contentType: "image/png" }));
  const row = check(await supabase.from("images").insert({ user_id: user.id, prompt, path }).select("*").single());
  const signed = check(await supabase.storage.from("images").createSignedUrl(path, 60 * 60 * 24));
  return { id: row.id, prompt, path, src: signed.signedUrl, created_at: row.created_at };
}

export async function deleteImage(user: User | null, item: ImageItem) {
  if (!user) return lsSet(K.images, lsGet<ImageItem>(K.images).filter((i) => i.id !== item.id));
  if (item.path) await supabase.storage.from("images").remove([item.path]);
  check(await supabase.from("images").delete().eq("id", item.id));
}

// ---------- Usage ----------
export async function trackUsage(user: User | null, kind: UsageKind) {
  try {
    if (!user) return lsSet(K.usage, [...lsGet<UsageEvent>(K.usage), { kind, created_at: now() }]);
    await supabase.from("usage_events").insert({ user_id: user.id, kind });
  } catch {
    /* usage tracking must never block the user */
  }
}

export async function listUsage(user: User | null, sinceDays = 30): Promise<UsageEvent[]> {
  const since = new Date(Date.now() - sinceDays * 864e5).toISOString();
  if (!user) return lsGet<UsageEvent>(K.usage).filter((u) => u.created_at >= since);
  const data = check(
    await supabase.from("usage_events").select("kind,created_at").gte("created_at", since).order("created_at").limit(5000),
  );
  return (data ?? []) as UsageEvent[];
}

// ---------- Shares (signed-in only) ----------
export async function createShare(user: User, kind: string, title: string, payload: unknown): Promise<string> {
  const data = check(
    await supabase.from("shares").insert({ user_id: user.id, kind, title, payload: payload as never }).select("id").single(),
  );
  return data.id;
}
export async function listShares(): Promise<Share[]> {
  return (check(await supabase.from("shares").select("*").order("created_at", { ascending: false })) ?? []) as Share[];
}
export async function deleteShare(id: string) {
  check(await supabase.from("shares").delete().eq("id", id));
}
export function shareUrl(id: string) {
  return `${window.location.origin}/s/${id}`;
}

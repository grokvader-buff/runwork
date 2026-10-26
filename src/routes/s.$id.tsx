import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Logo } from "@/components/app-shell";
import { MessageResponse } from "@/components/ai-elements/message";
import type { Database } from "@/integrations/supabase/types";

const getShare = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient<Database>(process.env.SUPABASE_URL!, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: rows, error } = await sb.rpc("get_share", { share_id: data.id });
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    return row ? { kind: row.kind, title: row.title, payload: row.payload as Record<string, unknown>, created_at: row.created_at } : null;
  });

export const Route = createFileRoute("/s/$id")({
  loader: async ({ params }) => {
    try {
      return await getShare({ data: { id: params.id } });
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} · Shared on RunWork` : "Shared on RunWork";
    const src = loaderData?.kind === "image" ? (loaderData.payload.src as string | undefined) : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: "Someone shared this with you on RunWork." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Someone shared this with you on RunWork." },
        ...(src?.startsWith("https://") ? [{ property: "og:image", content: src }, { name: "twitter:image", content: src }] : []),
      ],
    };
  },
  component: SharedPage,
});

function SharedPage() {
  const share = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <Logo className="size-9" />
          <span className="font-display font-semibold">RunWork</span>
        </Link>
        <div className="glass-card p-6 sm:p-10">
          {!share ? (
            <p className="text-center text-muted-foreground">This link is no longer shared.</p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">Shared {share.kind}</p>
              <h1 className="mt-1 mb-6 text-2xl font-semibold">{share.title}</h1>
              {share.kind === "chat" && (
                <div className="space-y-4">
                  {((share.payload.messages as { role: string; text: string }[]) ?? []).map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="ml-auto w-fit max-w-[85%] rounded-3xl bg-primary px-4 py-3 text-primary-foreground whitespace-pre-wrap">{m.text}</div>
                    ) : (
                      <div key={i}><MessageResponse>{m.text}</MessageResponse></div>
                    ),
                  )}
                </div>
              )}
              {share.kind === "journal" && (
                <div className="space-y-6">
                  <p className="whitespace-pre-wrap leading-relaxed">{share.payload.body as string}</p>
                  {typeof share.payload.reflection === "string" && share.payload.reflection && (
                    <div className="rounded-3xl bg-brand-soft p-5"><MessageResponse>{share.payload.reflection}</MessageResponse></div>
                  )}
                </div>
              )}
              {share.kind === "image" && (
                <figure>
                  <img src={share.payload.src as string} alt={share.payload.prompt as string} className="w-full rounded-3xl" />
                  <figcaption className="mt-3 text-sm text-muted-foreground">{share.payload.prompt as string}</figcaption>
                </figure>
              )}
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Get your own work done with <Link to="/" className="font-medium text-brand">RunWork</Link>.
        </p>
      </div>
    </div>
  );
}

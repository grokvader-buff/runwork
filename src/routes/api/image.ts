import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY_URL } from "@/lib/ai/gateway.server";

const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";

export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI is not configured" }, { status: 500 });
        const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: string };
        if (!prompt?.trim()) return Response.json({ error: "Describe the image first" }, { status: 400 });

        const res = await fetch(`${GATEWAY_URL}/v1/images/generations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: IMAGE_MODEL, prompt: prompt.slice(0, 4000) }),
          signal: request.signal,
        });
        if (!res.ok) {
          const msg =
            res.status === 429
              ? "Too many requests — try again shortly."
              : res.status === 402
                ? "AI credits are used up. Add credits in your workspace."
                : "Image generation failed.";
          return Response.json({ error: msg }, { status: res.status });
        }
        const data = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
        const item = data.data?.[0];
        if (!item?.b64_json && !item?.url) return Response.json({ error: "No image returned" }, { status: 502 });
        return Response.json({ b64: item.b64_json ?? null, url: item.url ?? null });
      },
    },
  },
});

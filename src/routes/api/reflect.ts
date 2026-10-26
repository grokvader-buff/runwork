import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createGateway } from "@/lib/ai/gateway.server";

export const Route = createFileRoute("/api/reflect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const { text } = (await request.json().catch(() => ({}))) as { text?: string };
        if (!text?.trim()) return new Response("Write something first", { status: 400 });
        const gateway = createGateway(apiKey);
        const result = streamText({
          model: gateway("google/gemini-3.8-flash"),
          system:
            "You are RunWork's gentle journaling companion. Read the user's journal entry and reply with a short, warm reflection: what you notice, one insight, and one thoughtful question or small next step. Use Markdown, under 180 words. Never mention models or providers.",
          prompt: text.slice(0, 20000),
          maxRetries: 0,
          abortSignal: request.signal,
        });
        return result.toTextStreamResponse();
      },
    },
  },
});

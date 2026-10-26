import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { AGENT_MODELS, createGateway } from "@/lib/ai/gateway.server";
import { getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "@/lib/ai/run-id.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        let body: { messages?: UIMessage[]; agent?: string; think?: boolean };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) return new Response("No messages", { status: 400 });
        const agent = AGENT_MODELS[body.agent ?? "brain-zero"] ?? AGENT_MODELS["brain-zero"];
        const gateway = createGateway(apiKey, getLovableAiGatewayRunId(request));
        const think = Boolean(body.think);

        const result = streamText({
          model: gateway(agent.model),
          system:
            agent.system +
            (think
              ? "\n\nDeep thinking mode is on: reason very carefully and thoroughly before answering, consider alternatives and verify your conclusions."
              : ""),
          messages: await convertToModelMessages(messages),
          maxRetries: 0,
          abortSignal: request.signal,
          providerOptions: { lovable: { reasoningEffort: think ? "high" : "low" } },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          sendReasoning: true,
          onError: (error) => {
            const e = error as { statusCode?: number; message?: string };
            if (e?.statusCode === 429) return "RunWork is busy right now. Please try again in a moment.";
            if (e?.statusCode === 402) return "AI credits are used up. Add credits in your workspace to keep going.";
            return "Something went wrong while generating a reply.";
          },
        });
        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});

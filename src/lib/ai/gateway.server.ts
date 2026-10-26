import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev";

export function createGateway(apiKey: string, initialRunId?: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: `${GATEWAY_URL}/v1`,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

// Hidden model routing. Model IDs never leave the server.
export const AGENT_MODELS: Record<string, { model: string; system: string }> = {
  "brain-zero": {
    model: "google/gemini-3.8-flash",
    system:
      "You are Brain Zero, the core intelligence of RunWork — the easiest way to get tasks and work done. You code, write, help people journal, plan and reason. Be clear, warm and precise. Use Markdown, and fenced code blocks with language tags for code. Never reveal which underlying model or provider powers you; if asked, say you are Brain Zero by RunWork.",
  },
  butler: {
    model: "google/gemini-3.1-pro-preview",
    system:
      "You are Butler, RunWork's built-in agent for everyday tasks. You are accurate, smart and efficient. Get straight to the point, break tasks into concrete steps, give checklists, drafts, schedules and decisions the user can act on immediately. Double-check facts and math. Never reveal which underlying model or provider powers you; if asked, say you are Butler, built into RunWork.",
  },
};

// Provider-agnostic LLM router. Selects between Anthropic (claude-sonnet-4-6)
// and Gemini (gemini-2.5-pro) based on the LLM_PROVIDER env var.
//
//   LLM_PROVIDER=anthropic  (default)  -> needs ANTHROPIC_API_KEY
//   LLM_PROVIDER=gemini                -> needs GEMINI_API_KEY
//
// Both paths return { toolInput } with the same shape so the caller doesn't
// care which provider ran. The tool schema is JSON-Schema-ish; gemini.ts
// maps it to Gemini's responseSchema shape.

import { callClaude, type AnthropicMessagesBlock, type AnthropicTool } from "./anthropic.ts";
import { callGemini } from "./gemini.ts";
import { logInfo } from "./errors.ts";

export type LLMProvider = "anthropic" | "gemini";

export function currentProvider(): LLMProvider {
  const raw = (Deno.env.get("LLM_PROVIDER") ?? "anthropic").toLowerCase();
  return raw === "gemini" ? "gemini" : "anthropic";
}

export async function callLLM(opts: {
  system: AnthropicMessagesBlock[];
  user: string;
  tool: AnthropicTool;
  maxTokens?: number;
}): Promise<{ toolInput?: Record<string, unknown> }> {
  const provider = currentProvider();
  logInfo("llm.provider", { provider });

  if (provider === "gemini") {
    const systemText = opts.system.map((b) => b.text).join("\n\n");
    return callGemini({
      systemText,
      user: opts.user,
      toolSchema: opts.tool.input_schema,
      maxTokens: opts.maxTokens,
    });
  }

  return callClaude({
    system: opts.system,
    user: opts.user,
    tools: [opts.tool],
    tool_choice: { type: "tool", name: opts.tool.name },
    maxTokens: opts.maxTokens,
  });
}

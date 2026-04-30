// Anthropic wrapper: calls claude-sonnet-4-6 with prompt caching on the
// static system prompt + catalog. Uses the official /v1/messages REST API.

import { retry, withTimeout, logError } from "./errors.ts";

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

export interface AnthropicMessagesBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export async function callClaude(opts: {
  system: AnthropicMessagesBlock[];
  user: string;
  tools?: AnthropicTool[];
  tool_choice?: { type: "tool"; name: string };
  maxTokens?: number;
}): Promise<{ content: unknown[]; toolInput?: Record<string, unknown> }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const body = {
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    tools: opts.tools,
    tool_choice: opts.tool_choice,
  };

  const res = await retry(
    async () => {
      const r = await withTimeout(
        fetch(API_URL, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "prompt-caching-2024-07-31",
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        45_000,
        "anthropic",
      );
      if (r.status === 429 || (r.status >= 500 && r.status < 600)) {
        throw new Error(`retryable ${r.status}: ${await r.text()}`);
      }
      if (!r.ok) {
        const text = await r.text();
        logError("anthropic.non_retryable", { status: r.status, text });
        throw new Error(`anthropic ${r.status}: ${text}`);
      }
      return r;
    },
    { tries: 3, baseMs: 800, shouldRetry: (e) => String(e).includes("retryable") },
  );

  const data = await res.json();
  const content = data.content as unknown[];

  // If tool use requested, extract input from the first tool_use block.
  const toolBlock = content?.find?.(
    (b): b is { type: "tool_use"; input: Record<string, unknown> } =>
      typeof b === "object" && b !== null && (b as { type?: string }).type === "tool_use",
  );
  return { content, toolInput: toolBlock?.input };
}

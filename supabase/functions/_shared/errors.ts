// Small error/retry/timeout helpers used across the pipeline.

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

export function cors(): Response {
  return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

export async function withTimeout<T>(p: Promise<T>, ms: number, label = "operation"): Promise<T> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { tries?: number; baseMs?: number; shouldRetry?: (e: unknown) => boolean } = {},
): Promise<T> {
  const tries = opts.tries ?? 3;
  const base  = opts.baseMs ?? 500;
  const should = opts.shouldRetry ?? (() => true);
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === tries - 1 || !should(err)) break;
      const wait = base * Math.pow(2, i) + Math.random() * 250;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

export function logInfo(msg: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", msg, ...extra }));
}
export function logError(msg: string, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", msg, ...extra }));
}

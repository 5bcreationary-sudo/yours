// Service-role Supabase client for edge functions. Never expose this to the
// browser — it bypasses RLS. Every edge function imports from here.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "yours-edge" } },
  });
  return cached;
}

// Accepts either the dispatch secret (preferred — rotated independently of
// Supabase keys) or the service role key (dev convenience). Cron sends the
// dispatch secret from vault; local curl calls can use either.
export function isServiceRoleBearer(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const dispatch = Deno.env.get("CRON_DISPATCH_SECRET");
  if (dispatch && authHeader === `Bearer ${dispatch}`) return true;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (key && authHeader === `Bearer ${key}`) return true;
  return false;
}

// Verify a user's bearer token and return the auth.users id.
export async function getUserIdFromBearer(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1];
  const client = getServiceClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

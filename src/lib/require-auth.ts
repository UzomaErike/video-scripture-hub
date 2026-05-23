import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns the authenticated user's id when the incoming server-fn request
 * carries a valid Supabase bearer token, otherwise null.
 * Used to gate expensive AI-generation paths while keeping cached reads public.
 */
export async function getAuthedUserId(): Promise<string | null> {
  const authHeader = getRequestHeader("Authorization") || getRequestHeader("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

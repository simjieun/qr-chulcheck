import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerEnv } from "./env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = assertServerEnv("supabaseUrl");
  const serviceRoleKey = assertServerEnv("supabaseServiceRoleKey");

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedClient;
}

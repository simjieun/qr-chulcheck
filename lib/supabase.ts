import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { assertServerEnv } from "./env";

let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = assertServerEnv("supabaseUrl");
  const serviceRoleKey = assertServerEnv("supabaseServiceRoleKey");

  cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedClient;
}

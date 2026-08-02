import { createClient } from "@supabase/supabase-js";
import { getRequiredServerEnv } from "@/lib/env";

export function createAdminClient() {
  const url = getRequiredServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRequiredServerEnv("SUPABASE_SECRET_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
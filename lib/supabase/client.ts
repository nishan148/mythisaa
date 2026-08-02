import { createBrowserClient } from "@supabase/ssr";
import { getRequiredSupabaseConfig } from "@/lib/env";

export function createClient() {
  const config = getRequiredSupabaseConfig();
  return createBrowserClient(config.url, config.key);
}
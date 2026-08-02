import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRequiredSupabaseConfig } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const config = getRequiredSupabaseConfig();

  return createServerClient(config.url, config.key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot write cookies. Middleware handles refreshes.
          }
        },
      },
  });
}
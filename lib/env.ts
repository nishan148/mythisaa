const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publicSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export function getPublicSupabaseConfig() {
  if (!publicSupabaseUrl || !publicSupabaseKey) return null;
  return { url: publicSupabaseUrl, key: publicSupabaseKey };
}

export function getRequiredServerEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getRequiredSupabaseConfig() {
  const config = getPublicSupabaseConfig();
  if (!config) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured.");
  }
  return config;
}

import { NextResponse } from "next/server";
import { getPublicSupabaseConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const supabase = getPublicSupabaseConfig();
  return NextResponse.json({
    ok: Boolean(supabase),
    service: "mythmind",
    environment: process.env.VERCEL_ENV ?? "local",
    configured: { supabase: Boolean(supabase), appUrl: Boolean(process.env.APP_URL) },
  }, { status: supabase ? 200 : 503 });
}
# MythMind Vercel Production Checklist

## Project settings

- Framework preset: `Next.js`
- Install command: leave as Vercel default
- Build command: `npm run build`
- Output directory: leave empty (do not use the Cloudflare/OpenNext output)
- Node.js: 20.x or 22.x

This repository also contains Cloudflare configuration. Do not set Vercel's build command to `npm run build:cloudflare` or `npm run deploy`.

## Environment variables

Add every required value in Vercel under **Project Settings > Environment Variables** and enable it for Production (and Preview when needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `APP_URL=https://mythmind.co`
- `AGENTROUTER_API_KEY`, `AGENTROUTER_BASE_URL`, and `AGENTROUTER_MODEL`
- `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, and `DODO_PAYMENTS_ENVIRONMENT=live_mode`
- `DODO_PRODUCT_HUSTLER`, `DODO_PRODUCT_PRO`, `DODO_PRODUCT_TEAM`, and `DODO_PRODUCT_STARTUP`

Never upload `.env.local` or expose server keys with a `NEXT_PUBLIC_` prefix. Redeploy after changing environment variables.

## Domain and external services

1. Add both `mythmind.co` and `www.mythmind.co` in Vercel Domains; redirect `www` to the apex domain.
2. Configure the DNS records exactly as Vercel displays and remove conflicting A/AAAA/CNAME records.
3. In Supabase Auth URL Configuration, set Site URL to `https://mythmind.co`.
4. Add `https://mythmind.co/auth/callback` and `https://mythmind.co/auth/confirm` to Supabase redirect URLs.
5. Configure Dodo's production webhook as `https://mythmind.co/api/billing/webhook` using the same webhook key stored in Vercel.

## Verification

After deployment, open `https://mythmind.co/api/health`. It returns HTTP 200 with `"ok": true` when the required public Supabase configuration is available. It never returns secret values.

Then verify the homepage, sign-in, auth callback, account page, AI chat, checkout creation, and a signed Dodo webhook. For a remaining 500, inspect the matching request in Vercel's Runtime Logs; the deployment build logs alone do not include serverless runtime failures.
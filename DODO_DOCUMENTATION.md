# MythMind + Dodo Payments

This guide explains how to test billing safely and which production endpoints to configure for `mythmind.co`.

## 1. Required Dodo products

Create or confirm these **recurring monthly** products in the Dodo dashboard:

| MythMind plan | Price | Credits | Environment variable |
|---|---:|---:|---|
| Hustler | $3/month | 300/day | `DODO_PRODUCT_HUSTLER` |
| Pro | $29/month | 10,000/month | `DODO_PRODUCT_PRO` |
| Team | $99/month | 40,000/month | `DODO_PRODUCT_TEAM` |
| MythMind Startup | $299/month | 100,000/month | `DODO_PRODUCT_STARTUP` |

The product IDs are intentionally kept on the server. The browser sends only a plan name; the API chooses the product ID from environment variables.

## 2. Local test mode

Use Dodo's **test/sandbox mode** and test product IDs. Do not use live keys locally.

1. Copy `.env.example` to `.env.local` if needed.
2. Set `DODO_PAYMENTS_ENVIRONMENT=test_mode`.
3. Fill in `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, and all four test product IDs.
4. Ensure Supabase local/server values are present, including `SUPABASE_SECRET_KEY`.
5. Start the app:

```powershell
npm run dev
```

6. Sign up or sign in at `http://localhost:3000/login`.
7. Open `http://localhost:3000/checkout?plan=startup&context=personal`.
8. Select a plan and click **Continue with ...**. The app calls `POST /api/billing`, and the server redirects to Dodo checkout.
9. Complete the test checkout using Dodo's test payment details.
10. Confirm the Dodo dashboard shows the test subscription and that the webhook request was delivered.
11. Confirm the user's `mythmind_billing_accounts` row changes to `startup` with `100000` credits.

### Local webhook delivery with a permanent Cloudflare Tunnel

The Dodo dashboard cannot reach `localhost`. For a stable test URL, use a named Cloudflare Tunnel instead of ngrok.

Install `cloudflared` on Windows:

```powershell
winget install Cloudflare.cloudflared
```

Authenticate it with the Cloudflare account that manages `mythmind.co`:

```powershell
cloudflared tunnel login
```

Create the tunnel once:

```powershell
cloudflared tunnel create mythmind-dev
```

Create `C:\Users\YOUR_WINDOWS_USER\.cloudflared\config.yml` and replace `YOUR_TUNNEL_UUID`:

```yaml
tunnel: YOUR_TUNNEL_UUID
credentials-file: C:\Users\YOUR_WINDOWS_USER\.cloudflared\YOUR_TUNNEL_UUID.json

ingress:
  - hostname: webhook-dev.mythmind.co
    service: http://localhost:3000
  - service: http_status:404
```

Create the DNS route once:

```powershell
cloudflared tunnel route dns mythmind-dev webhook-dev.mythmind.co
```

Start MythMind in one terminal and leave it running:

```powershell
cd d:\mythmind
npm run dev
```

In a second terminal, start the permanent tunnel:

```powershell
cloudflared tunnel run mythmind-dev
```

Your stable Dodo test webhook URL is:

```text
https://webhook-dev.mythmind.co/api/billing/webhook
```

In the Dodo **test/sandbox** dashboard, create an endpoint with that URL, select `subscription.active`, `subscription.renewed`, and `subscription.updated`, and copy its signing key into `.env.local`:

```text
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_WEBHOOK_KEY=the_test_endpoint_signing_key
```

Restart `npm run dev` after changing `.env.local`. Keep this test endpoint separate from production. Do not point live Dodo events to it.

To inspect the tunnel, use the terminal output or Cloudflare Zero Trust dashboard. There is no ngrok inspector for `cloudflared`.

```text
https://one.dash.cloudflare.com/
```

Your browser checkout remains:

```text
http://localhost:3000/checkout?plan=startup&context=personal
```

You may also open the app through the stable tunnel URL:

```text
https://webhook-dev.mythmind.co/checkout?plan=startup&context=personal
```

but you must still be signed in to the same Supabase environment.

### What to inspect during a local test

- Browser Network tab: `POST /api/billing` should return a Dodo `checkoutUrl`; no secret should appear in the response.
- Dodo dashboard: checkout/subscription and webhook delivery should be successful.
- Supabase `mythmind_billing_accounts`: plan, credit values, Dodo subscription ID, and subscription status.
- Supabase `mythmind_billing_webhook_events`: one row per processed webhook event. Re-delivery of the same event should return success without granting credits twice.

## 3. Production environment variables

Configure these in the hosting provider's server environment, not in source control:

```text
APP_URL=https://mythmind.co
DODO_PAYMENTS_ENVIRONMENT=live_mode
DODO_PAYMENTS_API_KEY=<live server API key>
DODO_PAYMENTS_WEBHOOK_KEY=<live endpoint signing key>
DODO_PRODUCT_HUSTLER=<live product id>
DODO_PRODUCT_PRO=<live product id>
DODO_PRODUCT_TEAM=<live product id>
DODO_PRODUCT_STARTUP=<live product id>
SUPABASE_SECRET_KEY=<server-only Supabase secret key>
```

Never use `NEXT_PUBLIC_` for Dodo keys or `SUPABASE_SECRET_KEY`. Rotate any secret that has been pasted into chat, a screenshot, a commit, or a client-side file.

## 4. Production Dodo webhook endpoint

Create exactly this endpoint in Dodo Payments:

```text
https://mythmind.co/api/billing/webhook
```

Subscribe it to:

- `subscription.active`
- `subscription.renewed`
- `subscription.updated`

The endpoint must use the live endpoint signing secret as `DODO_PAYMENTS_WEBHOOK_KEY`. It reads the raw request body, verifies Dodo's signature, rejects incomplete metadata, and records the event ID before applying entitlements. Do not disable signature verification.

## 5. Production checkout flow

1. An authenticated user opens `/checkout?plan=pro&context=personal` or selects a plan in the app.
2. `POST /api/billing` verifies the Supabase session and workspace ownership.
3. The server maps the validated plan to its server-side Dodo product ID.
4. Dodo hosts payment collection; card details never pass through MythMind.
5. Dodo sends the signed subscription event to `/api/billing/webhook`.
6. MythMind verifies the event and updates credits in Supabase.

The browser return URL indicates that checkout returned; it is **not** treated as proof of payment. The webhook is the source of truth.

## 6. Deployment checklist

- [ ] Apply the billing migration to the production Supabase project.
- [ ] Confirm RLS remains enabled and the webhook-events table is inaccessible to `anon` and `authenticated` roles.
- [ ] Add live Dodo product IDs and live secrets to the deployment platform.
- [ ] Set the Dodo webhook URL to `https://mythmind.co/api/billing/webhook`.
- [ ] Deploy and verify `npm run build` succeeds.
- [ ] Run one low-risk live checkout only after confirming the live product price and recurring interval.
- [ ] Verify the webhook delivery and Supabase entitlement before granting production access.
- [ ] Configure monitoring/alerts for webhook HTTP 4xx/5xx responses.

## 7. Expected endpoint responses

| Request | Expected result |
|---|---|
| Unauthenticated `POST /api/billing` | `401 Authentication required.` |
| Non-owner `POST /api/billing` | `403` |
| Valid paid plan | `200` with `checkoutUrl` and `sessionId` |
| Invalid webhook signature | `401` |
| Missing webhook secret | `503` |
| Duplicate webhook delivery | `200` with `duplicate: true` |

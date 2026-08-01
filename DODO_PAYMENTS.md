# Dodo Payments production setup

1. Add the server-only variables from `.env.example` to the production host. Never expose the API key, webhook key, or Supabase secret key through a `NEXT_PUBLIC_` variable.
2. Configure the recurring Dodo product IDs for Hustler, Pro, Team, and MythMind Startup. Startup must be configured as USD 299/month.
3. In Dodo Payments, register `https://mythmind.co/api/billing/webhook` as the webhook URL.
4. Subscribe it to `subscription.active`, `subscription.renewed`, and `subscription.updated` events.
5. Copy the endpoint signing key to `DODO_PAYMENTS_WEBHOOK_KEY`, deploy, and send a signed test event.

The checkout API requires a signed-in workspace owner. Product IDs and prices are selected server-side. Entitlements are granted only by a verified, replay-protected webhook.
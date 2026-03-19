# Prompt2Craft SaaS launch checklist

## Billing

- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment.
- Keep Razorpay in test mode until checkout and verification work end-to-end.
- Apply [`docs/supabase_billing.sql`](./supabase_billing.sql) if you want verified payment rows and generation credits stored in Supabase.
- Move paid-generation credit consumption to a trusted backend or Supabase Edge Function before production launch.

## Core product

- Set `GROQ_API_KEY` for slide generation.
- Set `UNSPLASH_ACCESS_KEY` if you want richer real-photo coverage beyond Wikipedia entity images.
- Keep Supabase auth configured in the frontend with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Production hardening

- Add webhook handling so payment success is recorded even if the browser closes after checkout.
- Store verified billing records before incrementing paid usage counters.
- Replace localhost API URLs with environment-specific frontend configuration.
- Add rate limits and server-side auth checks around preview and generation endpoints.

# Printful integration

Styvex uses a Printful **Manual order/API** store. Products must first be designed and published in that Printful store, then imported with:

```sh
npm run sync-printful
```

The sync command reads server credentials from the local environment and upserts Printful products, variants, and images into Supabase. Never expose these values through `VITE_*` variables or commit them:

- `PRINTFUL_TOKEN`: single-store private token with `orders` and `sync_products` access.
- `PRINTFUL_STORE_ID`: optional for a single-store token; required for an account-level token.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only database access used by the sync script.

The same Printful credentials must be stored as Supabase Edge Function secrets for fulfillment.

## Paid-order flow

1. Checkout validates product prices and availability from Supabase.
2. Styvex stores a pending order and its supplier mappings.
3. Stripe collects the merchandise total and the same shipping amount shown by checkout.
4. The signed Stripe webhook accepts the order only when Stripe reports `payment_status=paid`.
5. The webhook creates a Printful **draft** for Printful items.
6. A store administrator reviews and confirms the draft in Printful. That confirmation submits fulfillment and charges the configured Printful billing method.

Styvex intentionally does not call Printful's order-confirmation endpoint. This prevents supplier charges before payment and avoids silently charging the Printful billing method.

## Required production setup

- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Supabase Edge Function secrets.
- Register the deployed `stripe-webhook` function URL in Stripe for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.
- Add `PRINTFUL_TOKEN` and, if applicable, `PRINTFUL_STORE_ID` to Supabase Edge Function secrets.
- Add a Printful billing method before confirming any draft order.
- Run one Stripe test-mode purchase and verify the Supabase order, order items, shipping total, and Printful draft before enabling live payments.

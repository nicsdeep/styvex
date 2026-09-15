# STYVEX merchant pricing rules

Owner-approved 2026-09-14. This file and AGENTS.md are durable project instructions;
read them before changing commerce behavior. They do not create global assistant memory.

1. Supabase is the source of truth for published customer prices. Never display CJ
   cost as retail or apply category markup again in cards, product pages or checkout.
2. Retail = round(supplier cost × (1 + category markup / 100), 2), unless an admin
   sets a positive per-product retail_price_override. Clearing it restores the formula.
3. Shipping is separate. Customer shipping = round(actual quoted supplier freight ×
   (1 + supplier shipping markup / 100) + handling, 2). Initial CJ markup: 25%;
   handling: $1.50 once per order, not per unit. Example: $5.60 becomes $8.50.
4. Query actual variant IDs, quantities and destination. Never multiply a one-piece
   quote by quantity, invent stock/origins, or use a fixed fallback when quoting fails.
   Unsupported suppliers or split-origin bags require resolution before payment.
5. Standard U.S. shipping is free only when merchandise subtotal after discounts
   is strictly greater than $600, excluding tax/shipping. International shipping is
   charged separately. No hidden profitability exception after advertising this offer.
6. Free shipping never reduces supplier payment. STYVEX absorbs supplier freight.
   Revenue minus product costs is gross spread, not net profit. Deduct freight,
   processor fees, applicable expenses and taxes before assessing profitability.
7. Shipping settings and private quote records live in the database. Only admins
   can edit settings; only the payment service reads private quote costs. Customers
   receive the merchant total. Revalidate quotes and database prices before Stripe;
   require review again if the charge changes. Expire quotes after ten minutes.
8. Update policy pages, captions, banners, checkout, tests and this document together
   whenever business rules change. No old $50 promotion or fixed country rates.
9. Verify remote migrations, GitHub SHA and matching Vercel production deployment.
   Supabase Edge Function deployment is separate and must also be verified. Never
   claim checkout parity based only on a successful frontend deployment.
10. Do not create or pay supplier orders before verified customer payment. Automated
    CJ fulfillment is a separate integration, not implied by shipping calculation.

## Implementation boundaries

CJ is the enabled shipping adapter. Other suppliers and multi-origin bags fail
closed. Existing unmapped variants need repair before shipping can be quoted.
Geolocation suggestions, variant-specific retail prices and a supplier-cost review
queue are not part of this change. Existing cost sync still recalculates formula
prices; merchant overrides remain fixed. Do not describe these as implemented.

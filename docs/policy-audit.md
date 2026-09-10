# Policy consistency audit — 2026-09-10

## Implemented storefront changes
- Shared shipping estimate and eligibility rules in `src/lib/store-policy.ts`.
- Existing advertised offer retained: U.S. merchandise subtotal strictly over USD 50. Exactly USD 50 remains a paid-shipping order; international orders do not qualify.
- Shipping policy now reflects checkout's country estimates; removed nonexistent expedited/overnight options and unsupported guaranteed carrier/arrival claims.
- Return window uses delivery, not purchase, as its starting point. Removed references to an unimplemented returns portal and automatic prepaid labels.
- FAQ no longer advertises PayPal or working on-site tracking.
- Replaced tracking placeholder form with a truthful contact route.
- Checkout fails closed on missing/mocked payment URLs and retains the cart on failure.
- Removed checkout reassurance banner; compact, autofill-friendly address fields.
- AGENTS.md section 3.3 requires policy updates and backend verification in every affected task.

## Unresolved release blockers — do not claim full payment parity
- Repository `create-checkout-session` does not add shipping to Stripe line items or shipping options, although the storefront displays an estimate. Its deployed behavior has not been verified by this audit.
- The server function still has mock-success behavior when Stripe is not configured; the updated storefront refuses that URL. Direct server callers are not addressed by the frontend guard.
- Stripe configuration, real paid-order recording/webhooks, refund operations, and supplier/carrier tracking require end-to-end verification. No payment or order was placed during this audit.
- Privacy/terms require owner review of actual operational practices; this technical pass is not a legal compliance certification.
- No database migration or Edge Function deployment was performed in this pass.

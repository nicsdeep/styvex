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
- Checkout now persists an authoritative pending order before redirecting to Stripe and adds the displayed shipping charge to the Stripe session. The deployed behavior still requires an end-to-end paid test.
- The server mock-success fallback was removed; checkout fails closed when Stripe is not configured.
- Paid Stripe webhooks create Printful draft orders only after `payment_status=paid`. Drafts do not submit fulfillment or charge the Printful billing method.
- Stripe secrets/webhook delivery, Printful token/store setup, a real paid order, refunds, and supplier/carrier tracking still require end-to-end verification.
- Privacy/terms require owner review of actual operational practices; this technical pass is not a legal compliance certification.

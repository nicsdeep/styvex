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
- 2026-09-14 supplier repair: 60 products verified against CJ product IDs and existing SKU provenance; 12 variants mapped unambiguously. Five legacy/manual products and 92 variants remain unmapped (including legacy variants). See `cj-mapping-audit.json` for unresolved options and previous mapping values. No prices or stock were changed. Real option/stock import and destination/quantity freight integration remain pending.
- Checkout now persists an authoritative pending order before redirecting to Stripe and adds the displayed shipping charge to the Stripe session. The deployed behavior still requires an end-to-end paid test.
- The server mock-success fallback was removed; checkout fails closed when Stripe is not configured.
- Paid Stripe webhooks create Printful draft orders only after `payment_status=paid`. Drafts do not submit fulfillment or charge the Printful billing method.
- Stripe secrets/webhook delivery, Printful token/store setup, a real paid order, refunds, and supplier/carrier tracking still require end-to-end verification.
- Privacy/terms require owner review of actual operational practices; this technical pass is not a legal compliance certification.
# 2026-09-14 — merchant pricing and separate shipping

- Owner approved supplier freight × 1.25 + $1.50 handling once per order, editable under Admin Settings. Free standard US shipping applies strictly above $600 after discounts, excluding tax/shipping; supplier freight remains payable in full by STYVEX.
- Remote migration `20260914180000` applied. Product overrides, category repricing and override clearing tested in a rolled-back transaction. Fixed product-page double markup.
- Shipping calculator uses CJ variant quantities and inventory-origin countries, not flat per-country fees. Unmapped variants, unsupported suppliers and no common origin fail closed. Existing 92 unmapped variants remain a catalog-readiness blocker; no mappings were invented.
- Unit tests cover rounding, $600/$600.01 boundary, international orders, total-fee handling, quantity forwarding and unsupported items. Typecheck and production build pass.
- Checkout function deployed through the authenticated Supabase dashboard using repository sources with shared modules inlined. Existing bearer-token verification corrected. CJ runtime secret provisioned from the owner-authorized key.
- Stripe secret is absent in Supabase custom secrets. Actual payment completion and webhook-to-CJ fulfillment are NOT verified or enabled by this change. Never claim full production payment readiness.
- Deployed quote-only integration test passed: database subtotal $22.04, supplier returned $0 domestic US freight, customer shipping $1.50 handling. Separate live CN-to-US quote: supplier $12.52, calculated merchant charge $17.15. Supplier quotes are time-sensitive. Test account and its quotes were removed; no orders or payments created. Customer access to private shipping quotes was denied.
- Remaining: variant-specific costs/prices, supplier-cost review queue, split-origin shipping adapters, optional geolocation suggestion and payment processor configuration. Existing supplier costs in the legacy products schema still require a separate column-access audit; new shipping costs are service-only.

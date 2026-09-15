import assert from "node:assert/strict";
import { shippingCharge } from "../supabase/functions/_shared/shipping-math.ts";

assert.equal(shippingCharge(5.6, 25, 1.5, 31, "US", 600, "US"), 8.5);
assert.equal(shippingCharge(20.23, 25, 1.5, 100, "US", 600, "US"), 26.79);
assert.equal(shippingCharge(5.6, 25, 1.5, 600, "US", 600, "US"), 8.5);
assert.equal(shippingCharge(5.6, 25, 1.5, 600.01, "US", 600, "US"), 0);
assert.equal(shippingCharge(5.6, 25, 1.5, 700, "CA", 600, "US"), 8.5);
assert.equal(shippingCharge(0, 25, 1.5, 31, "US", 600, "US"), 1.5);
assert.throws(() => shippingCharge(NaN, 25, 1.5, 31, "US", 600, "US"));
assert.throws(() => shippingCharge(-1, 25, 1.5, 31, "US", 600, "US"));

globalThis.Deno = { env: { get: () => "test-only" } };
const { quoteShipping } = await import("../supabase/functions/_shared/cj-shipping.ts");
const service = {
  from: (table) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({
          data:
            table === "checkout_policy"
              ? { free_shipping_threshold: 600, free_shipping_country: "US" }
              : { enabled: true, markup_percentage: 25, handling_fee: 1.5 },
        }),
      }),
    }),
  }),
};
let quantity = 0;
let totalPostageFee = 5.6;
globalThis.fetch = async (url, options) => ({
  ok: true,
  json: async () => {
    if (url.includes("getAccessToken")) return { result: true, data: { accessToken: "test" } };
    if (url.includes("queryByVid"))
      return {
        result: true,
        data: { vid: "real-id", inventories: [{ countryCode: "US", totalInventory: 100 }] },
      };
    const body = JSON.parse(options.body);
    quantity = body.products[0].quantity;
    assert.equal(body.startCountryCode, "US");
    assert.equal(body.endCountryCode, "US");
    return {
      result: true,
      data: [{ logisticName: "Standard", logisticPrice: 5, taxesFee: 0.6, totalPostageFee }],
    };
  },
});
const item = { supplier: "cj", supplierVariantId: "real-id", quantity: 20 };
const result = await quoteShipping(service, [item], { country: "US", postal_code: "10001" }, 31);
assert.equal(quantity, 20);
assert.equal(result.supplierShipping, 5.6);
assert.equal(result.customerShipping, 8.5);
totalPostageFee = 0;
assert.equal((await quoteShipping(service, [item], {country:'US'}, 31)).customerShipping,8.5);
await assert.rejects(
  quoteShipping(service, [{ ...item, supplierVariantId: null }], { country: "US" }, 31),
);
await assert.rejects(
  quoteShipping(service, [{ ...item, supplier: "manual" }], { country: "US" }, 31),
);
await assert.rejects(quoteShipping(service, [{ ...item, quantity: 101 }], { country: "US" }, 31));
console.log(
  "Shipping tests passed: markup, rounding, threshold, destination, quantities, total fees, unmapped and unsupported items.",
);

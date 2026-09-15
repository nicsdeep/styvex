import { shippingCharge } from "./shipping-math.ts";

let accessToken = "";
let tokenExpires = 0;
const base = "https://developers.cjdropshipping.com/api2.0/v1";
async function cj(path: string, body?: unknown): Promise<any> {
  if (Date.now() >= tokenExpires) {
    const key = Deno.env.get("CJDROPSHIPPING_API_KEY");
    if (!key) throw new Error("Shipping is not configured. Please contact the store.");
    const response = await fetch(`${base}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
      signal: AbortSignal.timeout(15000),
    });
    const auth = await response.json();
    if (!response.ok || !auth.result || !auth.data?.accessToken)
      throw new Error("Shipping service is temporarily unavailable.");
    accessToken = auth.data.accessToken;
    tokenExpires = Date.now() + 60 * 60 * 1000;
  }
  const response = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "CJ-Access-Token": accessToken },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || !result.result)
    throw new Error("Unable to confirm shipping for this bag. Please contact the store.");
  return result.data;
}

export async function quoteShipping(service: any, items: any[], address: any, subtotal: number) {
  if (items.some((i) => i.supplier !== "cj" || !i.supplierVariantId))
    throw new Error(
      "A product needs shipping verification. Please contact the store before ordering.",
    );
  const [{ data: rule, error: ruleError }, { data: policy, error: policyError }] =
    await Promise.all([
      service.from("supplier_shipping_rules").select("*").eq("supplier", "cj").single(),
      service.from("checkout_policy").select("*").eq("id", 1).single(),
    ]);
  if (ruleError || policyError || !rule?.enabled)
    throw new Error("Shipping is temporarily unavailable.");

  // A common verified origin is required. Never guess CN or pretend that
  // separately warehoused products can ship in one parcel.
  let origins: string[] | null = null;
  for (const item of items) {
    const variant = await cj(
      `/product/variant/queryByVid?vid=${encodeURIComponent(item.supplierVariantId)}&features=enable_inventory`,
    );
    if (String(variant?.vid) !== item.supplierVariantId)
      throw new Error("Unable to verify a supplier variant.");
    const available = (variant.inventories || [])
      .filter((i: any) => Number(i.totalInventory) >= item.quantity)
      .map((i: any) => String(i.countryCode));
    origins = origins === null ? available : origins.filter((origin) => available.includes(origin));
  }
  if (!origins?.length)
    throw new Error(
      "These items require separate shipping arrangements. Please contact the store.",
    );
  const origin = origins.includes(address.country) ? address.country : [...origins].sort()[0];
  const rates = await cj("/logistic/freightCalculate", {
    startCountryCode: origin,
    endCountryCode: address.country,
    zip: address.postal_code,
    products: items.map((i) => ({ vid: i.supplierVariantId, quantity: i.quantity })),
  });
  const options = (Array.isArray(rates) ? rates : [])
    .map((r: any) => ({
      name: String(r.logisticName || ""),
      // CJ can return a zero placeholder total with positive freight. Use the
      // larger known total; do not add the total to its components twice.
      cost: Math.max(
        Number(r.totalPostageFee ?? 0),
        Number(r.logisticPrice) + Number(r.taxesFee || 0) + Number(r.clearanceOperationFee || 0),
      ),
    }))
    .filter((r: any) => r.name && Number.isFinite(r.cost) && r.cost >= 0)
    .sort((a: any, b: any) => a.cost - b.cost);
  if (!options.length)
    throw new Error("No shipping service is available for this address and bag.");
  const chosen = options[0];
  return {
    supplierShipping: chosen.cost,
    customerShipping: shippingCharge(
      chosen.cost,
      Number(rule.markup_percentage),
      Number(rule.handling_fee),
      subtotal,
      address.country,
      Number(policy.free_shipping_threshold),
      policy.free_shipping_country,
    ),
    details: {
      supplier: "cj",
      origin,
      service: chosen.name,
      markup: Number(rule.markup_percentage),
      handling: Number(rule.handling_fee),
      policy,
    },
  };
}

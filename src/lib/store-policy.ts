// Customer-facing rules: update checkout, policies and tests together.
export const FREE_US_SHIPPING_THRESHOLD = 50;
export const RETURN_WINDOW_DAYS = 30;
export const FREE_SHIPPING_COPY = `Free U.S. shipping on orders over $${FREE_US_SHIPPING_THRESHOLD}`;
export const DELIVERY_COPY = "Delivery timing varies by destination and supplier; no fixed arrival date is guaranteed.";
export function estimateShipping(country: string, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (country === "US") return subtotal > FREE_US_SHIPPING_THRESHOLD ? 0 : 5.99;
  if (country === "CA") return 12.99;
  if (["GB", "FR", "DE"].includes(country)) return 15.99;
  if (["KE", "ZA"].includes(country)) return 25.99;
  return 19.99;
}

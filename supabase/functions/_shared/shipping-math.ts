export function shippingCharge(
  cost: number,
  markup: number,
  handling: number,
  subtotal: number,
  country: string,
  threshold: number,
  freeCountry: string,
) {
  if (
    ![cost, markup, handling, subtotal, threshold].every(Number.isFinite) ||
    [cost, markup, handling, subtotal].some((v) => v < 0)
  )
    throw new Error("Invalid shipping calculation.");
  return country === freeCountry && subtotal > threshold
    ? 0
    : Math.round((cost * (1 + markup / 100) + handling + Number.EPSILON) * 100) / 100;
}

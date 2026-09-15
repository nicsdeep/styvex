// Quote-only integration test. Creates an isolated auth user, never a payment
// session or supplier order, and removes only its own test quotes/user afterward.
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
const url = process.env.SUPABASE_URL;
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const client = createClient(url, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
let userId;
try {
  const password = crypto.randomUUID() + "Aa1!";
  const email = `shipping-audit-${crypto.randomUUID()}@example.invalid`;
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw createError;
  userId = created.user.id;
  const { error: loginError } = await client.auth.signInWithPassword({ email, password });
  if (loginError) throw loginError;
  const { data: variants, error } = await service
    .from("product_variants")
    .select("id,product_id,supplier_variant_id,inventory_quantity,products!inner(supplier,price)")
    .not("supplier_variant_id", "is", null)
    .gt("inventory_quantity", 0)
    .eq("products.supplier", "cj")
    .limit(1);
  if (error || !variants?.length) throw new Error("No verified CJ variant available for test.");
  const v = variants[0];
  const { data, error: quoteError } = await client.functions.invoke("create-checkout-session", {
    body: {
      mode: "quote",
      email,
      items: [{ id: v.id, productId: v.product_id, quantity: 1 }],
      shipping: {
        name: "Shipping integration test",
        address: {
          line1: "Test address",
          line2: "",
          city: "New York",
          state: "NY",
          country: "US",
          postal_code: "10001",
        },
        phone: "",
      },
    },
  });
  if (quoteError) {
    const detail = quoteError.context ? await quoteError.context.json().catch(() => null) : null;
    throw new Error(detail?.error || quoteError.message);
  }
  assert.ok(data.quoteId);
  assert.ok(Number.isFinite(data.shipping));
  assert.equal(data.subtotal, Number(v.products.price));
  const { data: stored } = await service
    .from("checkout_shipping_quotes")
    .select("*")
    .eq("id", data.quoteId)
    .single();
  const expected =
    data.subtotal > 600
      ? 0
      : Math.round((Number(stored.supplier_shipping) * 1.25 + 1.5) * 100) / 100;
  assert.equal(data.shipping, expected);
  const { data: privateRead, error: privateError } = await client
    .from("checkout_shipping_quotes")
    .select("*");
  assert.ok(privateError || privateRead.length === 0);
  const { count } = await service
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  assert.equal(count, 0);
  console.log(
    JSON.stringify({
      quoteVerified: true,
      subtotal: data.subtotal,
      customerShipping: data.shipping,
      privateCostsProtected: true,
      ordersCreated: count,
    }),
  );
} finally {
  if (userId) {
    const { error } = await service.from("checkout_shipping_quotes").delete().eq("user_id", userId);
    if (error) throw error;
    const { error: deleteError } = await service.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
    console.log("Isolated test user and test quotes removed.");
  }
}

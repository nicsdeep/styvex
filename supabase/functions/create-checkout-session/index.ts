import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { quoteShipping } from "../_shared/cj-shipping.ts";

const ALLOWED_COUNTRIES = new Set(["US", "CA", "GB", "AU", "FR", "DE", "IT", "JP", "ZA", "KE"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let pendingOrderId: string | null = null;

  try {
    const { items, email, shipping, mode, quoteId } = await req.json();
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (mode !== "quote" && !stripeKey) throw new Error("Payment is not configured.");
    if (!serviceRoleKey) throw new Error("Order storage is not configured.");
    if (!Array.isArray(items) || !items.length || items.length > 100)
      throw new Error("Your cart is empty or too large.");

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await authClient.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
    if (!user) throw new Error("Unauthorized");

    const address = shipping?.address || {};
    const country = String(address.country || "").toUpperCase();
    if (
      !shipping?.name ||
      !address.line1 ||
      !address.city ||
      !address.postal_code ||
      !ALLOWED_COUNTRIES.has(country)
    ) {
      throw new Error("Complete the shipping address before payment.");
    }
    if (["US", "CA"].includes(country) && !address.state)
      throw new Error("State or province is required for this destination.");

    const requested = items.map((item: any) => ({
      productId: String(item.productId || item.product_id || ""),
      variantId: String(item.id || item.variantId || ""),
      quantity: Number(item.quantity),
    }));
    if (
      requested.some(
        (item: any) =>
          !item.productId ||
          !item.variantId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      throw new Error("The cart contains an invalid item.");
    }
    if (
      new Set(requested.map((i: any) => i.variantId)).size !== requested.length ||
      requested.some((i: any) => i.quantity > 1000)
    )
      throw new Error("Invalid cart quantities.");
    requested.sort((a: any, b: any) => a.variantId.localeCompare(b.variantId));

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const productIds = [...new Set(requested.map((item: any) => item.productId))];
    const variantIds = [...new Set(requested.map((item: any) => item.variantId))];
    const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
      await Promise.all([
        service.from("products").select("id, name, price, supplier").in("id", productIds),
        service
          .from("product_variants")
          .select("id, product_id, supplier_variant_id, inventory_quantity")
          .in("id", variantIds),
      ]);
    if (productsError || variantsError) throw new Error("Unable to verify the cart.");

    const productMap = new Map((products || []).map((product: any) => [product.id, product]));
    const variantMap = new Map((variants || []).map((variant: any) => [variant.id, variant]));
    const verified = requested.map((item: any) => {
      const product: any = productMap.get(item.productId);
      const variant: any = variantMap.get(item.variantId);
      if (!product || !variant || variant.product_id !== product.id)
        throw new Error("A cart item is no longer available.");
      if (variant.inventory_quantity < item.quantity)
        throw new Error(`${product.name} does not have enough available inventory.`);
      if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0)
        throw new Error("A product price needs verification.");
      return {
        ...item,
        name: product.name,
        price: Number(product.price),
        supplier: product.supplier || "manual",
        supplierVariantId: variant.supplier_variant_id || null,
      };
    });

    const subtotal =
      Math.round(
        verified.reduce(
          (sum: number, item: any) => sum + Math.round(item.price * 100) * item.quantity,
          0,
        ),
      ) / 100;
    address.country = country;
    const fingerprint = JSON.stringify({
      requested,
      address,
      name: shipping.name,
      email,
      phone: shipping.phone,
      subtotal,
    });
    const freight = await quoteShipping(service, verified, address, subtotal);
    const shippingCost = freight.customerShipping;
    if (mode === "quote") {
      const { data: quote, error } = await service
        .from("checkout_shipping_quotes")
        .insert({
          user_id: user.id,
          fingerprint,
          subtotal,
          customer_shipping: shippingCost,
          supplier_shipping: freight.supplierShipping,
          details: freight.details,
        })
        .select("id,expires_at")
        .single();
      if (error) throw new Error("Unable to save shipping quote.");
      return new Response(
        JSON.stringify({
          quoteId: quote.id,
          expiresAt: quote.expires_at,
          subtotal,
          shipping: shippingCost,
          total: subtotal + shippingCost,
          prices: verified.map((i: any) => ({ id: i.variantId, price: i.price })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { data: accepted, error: acceptedError } = await service
      .from("checkout_shipping_quotes")
      .select("*")
      .eq("id", quoteId || "")
      .eq("user_id", user.id)
      .single();
    if (
      acceptedError ||
      !accepted ||
      accepted.fingerprint !== fingerprint ||
      Date.parse(accepted.expires_at) <= Date.now() ||
      Number(accepted.customer_shipping) !== shippingCost ||
      ["origin", "service", "markup", "handling"].some(
        (key) => accepted.details[key] !== (freight.details as any)[key],
      )
    ) {
      throw new Error(
        "Shipping or pricing changed. Please calculate shipping again and review the total.",
      );
    }
    const { error: quoteUpdateError } = await service
      .from("checkout_shipping_quotes")
      .update({ supplier_shipping: freight.supplierShipping, details: freight.details })
      .eq("id", accepted.id);
    if (quoteUpdateError) throw new Error("Unable to confirm shipping quote.");
    const storedAddress = {
      name: String(shipping.name).trim(),
      address1: String(address.line1).trim(),
      address2: String(address.line2 || "").trim() || null,
      city: String(address.city).trim(),
      state_code:
        String(address.state || "")
          .trim()
          .toUpperCase() || null,
      country_code: country,
      zip: String(address.postal_code).trim(),
      phone: String(shipping.phone || "").trim() || null,
      email: String(email || user.email || "").trim(),
    };

    const { data: order, error: orderError } = await service
      .from("orders")
      .insert({
        user_id: user.id,
        customer_email: storedAddress.email,
        subtotal_amount: subtotal,
        shipping_amount: shippingCost,
        total_amount: subtotal + shippingCost,
        currency: "usd",
        shipping_quote_id: accepted.id,
        shipping_address: storedAddress,
        status: "pending",
        payment_status: "pending",
        fulfillment_status: "unsubmitted",
      })
      .select("id")
      .single();
    if (orderError) throw orderError;
    pendingOrderId = order.id;

    const { error: itemsError } = await service.from("order_items").insert(
      verified.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        supplier: item.supplier,
        supplier_variant_id: item.supplierVariantId,
      })),
    );
    if (itemsError) throw itemsError;

    const lineItems: any[] = verified.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
    if (shippingCost > 0)
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Standard shipping" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const origin = "https://styvex.vercel.app";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: storedAddress.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, order_id: order.id },
      payment_intent_data: { metadata: { user_id: user.id, order_id: order.id } },
    });
    const { error: sessionError } = await service
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);
    if (sessionError) throw sessionError;

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    if (pendingOrderId) {
      try {
        const service = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        await service.from("orders").update({ status: "checkout_failed" }).eq("id", pendingOrderId);
      } catch (_) {
        /* Preserve the checkout error. */
      }
    }
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message === "Unauthorized" ? 401 : 400,
    });
  }
});

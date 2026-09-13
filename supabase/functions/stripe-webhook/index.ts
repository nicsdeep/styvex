import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

async function createPrintfulDraft(supabase: any, order: any) {
  const items = (order.order_items || []).filter((item: any) => item.supplier === "printful");
  if (!items.length) {
    await supabase.from("orders").update({ fulfillment_status: "not_applicable" }).eq("id", order.id);
    return;
  }
  if (order.supplier_order_id) return;

  const token = Deno.env.get("PRINTFUL_TOKEN");
  const storeId = Deno.env.get("PRINTFUL_STORE_ID");
  if (!token) {
    await supabase.from("orders").update({
      fulfillment_provider: "printful", fulfillment_status: "configuration_required",
      fulfillment_error: "Printful API token is not configured.",
    }).eq("id", order.id);
    return;
  }
  if (items.some((item: any) => !item.supplier_variant_id)) {
    await supabase.from("orders").update({
      fulfillment_provider: "printful", fulfillment_status: "action_required",
      fulfillment_error: "A paid item is missing its Printful variant mapping.",
    }).eq("id", order.id);
    return;
  }

  const address = order.shipping_address || {};
  if (!address.name || !address.address1 || !address.city || !address.country_code || !address.zip) {
    await supabase.from("orders").update({
      fulfillment_provider: "printful", fulfillment_status: "action_required",
      fulfillment_error: "The paid order is missing a complete fulfillment address.",
    }).eq("id", order.id);
    return;
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (storeId) headers["X-PF-Store-Id"] = storeId;
  const response = await fetch("https://api.printful.com/orders?confirm=0&update_existing=true", {
    method: "POST", headers,
    body: JSON.stringify({
      external_id: order.id, shipping: "STANDARD", recipient: address,
      items: items.map((item: any) => ({
        sync_variant_id: Number(item.supplier_variant_id), quantity: item.quantity,
        retail_price: Number(item.price).toFixed(2),
      })),
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Printful request failed (${response.status})`);

  await supabase.from("orders").update({
    fulfillment_provider: "printful", fulfillment_status: "draft_created",
    supplier_order_id: String(payload.result.id), fulfillment_error: null,
  }).eq("id", order.id);
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !endpointSecret) return new Response("Webhook secret not configured", { status: 500 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
  try {
    const event = stripe.webhooks.constructEvent(await req.text(), signature, endpointSecret);
    const supported = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"]);
    if (!supported.has(event.type)) return new Response(JSON.stringify({ received: true }), { status: 200 });

    const session = event.data.object as any;
    const orderId = session.metadata?.order_id;
    if (!orderId) throw new Error("Missing order_id in Stripe session metadata");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    if (event.type === "checkout.session.async_payment_failed") {
      await supabase.from("orders").update({ status: "payment_failed", payment_status: "failed" }).eq("id", orderId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
    if (session.payment_status !== "paid") {
      await supabase.from("orders").update({ payment_status: session.payment_status || "pending" }).eq("id", orderId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const { data: order, error: orderError } = await supabase.from("orders").update({
      stripe_session_id: session.id, total_amount: session.amount_total ? session.amount_total / 100 : undefined,
      status: "paid", payment_status: "paid",
    }).eq("id", orderId).select("*, order_items(*)").single();
    if (orderError) throw orderError;

    try {
      await createPrintfulDraft(supabase, order);
    } catch (fulfillmentError: any) {
      console.error("Printful draft creation failed:", fulfillmentError);
      await supabase.from("orders").update({
        fulfillment_provider: "printful", fulfillment_status: "action_required",
        fulfillment_error: String(fulfillmentError.message || fulfillmentError).slice(0, 1000),
      }).eq("id", order.id);
    }

    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" }, status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});

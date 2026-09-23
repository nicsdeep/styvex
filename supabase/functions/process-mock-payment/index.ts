import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { orderId } = await req.json();
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!serviceRoleKey) throw new Error("Order storage is not configured.");

    // Verify user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await authClient.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
    if (!user) throw new Error("Unauthorized");

    // Connect with service role to bypass RLS for complex transactions
    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get order details
    const { data: order, error: orderError } = await service
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (order.status === "paid" || order.payment_status === "paid") {
      return new Response(JSON.stringify({ success: true, message: "Order already paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Create payment record
    const { data: payment, error: paymentError } = await service.from("payments").insert({
      order_id: order.id,
      provider: "mock",
      status: "completed",
      amount: order.total_amount,
      transaction_id: `mock_tx_${Date.now()}`,
    }).select().single();

    if (paymentError) throw paymentError;

    // 2 & 3. Mark order paid and record timestamp (updated_at)
    const { error: updateOrderError } = await service.from("orders").update({
      status: "paid",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);

    if (updateOrderError) throw updateOrderError;

    // 4. Add transition to order_status_history
    await service.from("order_status_history").insert({
      order_id: order.id,
      previous_status: order.status,
      new_status: "paid",
      changed_by: user.id,
      notes: "Mock payment confirmed automatically",
    });

    // 5. Reserve/deduct inventory
    for (const item of order.order_items) {
      if (item.variant_id) {
        // Fetch current inventory
        const { data: variant, error: varError } = await service
          .from("product_variants")
          .select("inventory_quantity")
          .eq("id", item.variant_id)
          .single();
          
        if (!varError && variant) {
          const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity);
          await service
            .from("product_variants")
            .update({ inventory_quantity: newQuantity })
            .eq("id", item.variant_id);
        }
      }
    }

    // 6. Make order available for admin fulfillment
    // (This is implicitly done by setting status to 'paid' and fulfillment_status to 'unsubmitted' which was already set during order creation)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error processing mock payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message === "Unauthorized" ? 401 : 400,
    });
  }
});

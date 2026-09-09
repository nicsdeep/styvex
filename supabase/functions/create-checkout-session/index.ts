import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Create Checkout Session function up and running!");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, email } = await req.json();

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // Fallback to mock behavior if no key is set yet
      console.log("No STRIPE_SECRET_KEY found, falling back to mock session.");
      const mockSessionUrl = `${req.headers.get("origin")}/checkout/success?session_id=mock_session_123`;
      return new Response(JSON.stringify({ url: mockSessionUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Fetch authoritative prices from the database
    const productIds = items.map((i: any) => i.productId || i.product_id || i.id);
    const { data: dbProducts, error: dbError } = await supabaseClient
      .from("products")
      .select("id, price")
      .in("id", productIds);

    if (dbError || !dbProducts) {
      throw new Error("Failed to verify product prices from the database");
    }

    const priceMap = new Map(dbProducts.map((p: any) => [p.id, p.price]));

    // 2. Format line items for Stripe
    const lineItems = items.map((item: any) => {
      const pId = item.productId || item.product_id || item.id;
      const verifiedPrice = priceMap.get(pId) ?? item.price;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : (item.imageUrl ? [item.imageUrl] : []),
          },
          unit_amount: Math.round(verifiedPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    // Create a simplified items payload for metadata to avoid 500-char limits
    const simplifiedItems = items.map((i: any) => ({ 
      id: i.id || i.product_id, // ensure we capture the actual product ID
      q: i.quantity, 
      p: i.price,
      n: i.name 
    }));
    
    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cart`,
      customer_email: email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        items: JSON.stringify(simplifiedItems).substring(0, 500), // Note: might truncate if very large cart
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

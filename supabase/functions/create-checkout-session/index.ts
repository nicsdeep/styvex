import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Create Checkout Session function up and running!");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, email } = await req.json();

    // 1. Initialize Stripe with process.env.STRIPE_SECRET_KEY
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    //   apiVersion: '2023-10-16',
    // });

    // 2. Format line items for Stripe
    // const lineItems = items.map((item: any) => ({
    //   price_data: {
    //     currency: 'usd',
    //     product_data: {
    //       name: item.name,
    //       images: [item.image],
    //     },
    //     unit_amount: Math.round(item.price * 100),
    //   },
    //   quantity: item.quantity,
    // }));

    // 3. Create Checkout Session
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: lineItems,
    //   mode: 'payment',
    //   success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${req.headers.get('origin')}/cart`,
    //   customer_email: email,
    // });

    // 4. Return Session ID (Mocked for now)
    const mockSessionUrl = `${req.headers.get("origin")}/checkout/success?session_id=mock_session_123`;

    return new Response(JSON.stringify({ url: mockSessionUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

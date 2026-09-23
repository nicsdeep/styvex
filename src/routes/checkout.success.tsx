import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/cart-context";

// Define the route with search params
export const Route = createFileRoute("/checkout/success")({
  component: CheckoutSuccessPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      session_id: search.session_id as string | undefined,
    }
  },
});

function CheckoutSuccessPage() {
  const { session_id } = Route.useSearch();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!session_id) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    const verifyOrder = async () => {
      try {
        let currentOrderId: string | null = null;
        
        // 1. Process mock payment if applicable
        if (session_id.startsWith("mock_")) {
          currentOrderId = session_id.replace("mock_", "");
          
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error("Unauthorized");
          
          const { error: mockError } = await supabase.functions.invoke("process-mock-payment", {
            headers: { Authorization: `Bearer ${session.session.access_token}` },
            body: { orderId: currentOrderId },
          });
          
          if (mockError) throw mockError;
        } else {
          // It's a Stripe session. We should fetch the order associated with this stripe_session_id
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id")
            .eq("stripe_session_id", session_id)
            .single();
            
          if (orderError || !order) throw new Error("Order not found or payment incomplete.");
          currentOrderId = order.id;
        }

        // 2. Fetch the updated order to confirm it's paid
        const { data: finalOrder, error: finalError } = await supabase
          .from("orders")
          .select("id, status")
          .eq("id", currentOrderId)
          .single();

        if (finalError || !finalOrder) throw new Error("Could not verify order status.");
        
        if (finalOrder.status !== "paid" && finalOrder.status !== "pending") {
           // We might still consider pending as success if we wait for webhooks
           // But mock payment should immediately be "paid"
           throw new Error("Payment was not successful.");
        }

        setOrderId(finalOrder.id);
        clearCart(); // Payment successful, clear the frontend cart
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to confirm payment.");
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [session_id, clearCart]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-24 md:px-12 lg:px-24 flex items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-brand" />
              <p className="text-muted-foreground">Verifying your payment...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center space-y-6">
              <XCircle className="h-16 w-16 text-red-500" />
              <h1 className="text-3xl font-light uppercase tracking-widest text-foreground">Payment Failed</h1>
              <p className="text-muted-foreground">{error}</p>
              <Link
                to="/cart"
                className="inline-block bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
              >
                Return to Cart
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6">
              <CheckCircle className="h-16 w-16 text-brand" />
              <h1 className="text-3xl font-light uppercase tracking-widest text-foreground">Order Confirmed</h1>
              <p className="text-muted-foreground">
                Thank you for your purchase! We've received your order and will notify you as soon as it ships.
              </p>
              {orderId && (
                <p className="text-sm font-semibold text-ink">Order ID: {orderId}</p>
              )}
              <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center mt-4">
                <Link
                  to="/account/orders"
                  className="inline-block border border-border px-8 py-4 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
                >
                  View Order
                </Link>
                <Link
                  to="/shop"
                  className="inline-block bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

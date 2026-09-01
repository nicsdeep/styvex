import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [email, setEmail] = useState(user?.email || "");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          items,
          email,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to initiate checkout");
      }

      if (data?.url) {
        // Redirect to the Stripe Checkout page (or mock success page)
        window.location.href = data.url;
      } else {
        // Fallback if the edge function is not deployed yet
        toast.success("Checkout simulated! (Edge function not active)");
        clearCart();
        navigate({ to: "/checkout/success" });
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during checkout.");
      
      // Fallback for development without Stripe keys
      setTimeout(() => {
        toast.info("Falling back to local mock checkout...");
        clearCart();
        navigate({ to: "/checkout/success" });
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="mb-12 text-3xl font-light uppercase tracking-widest text-foreground">Checkout</h1>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 border border-border/50 p-8">
              <h2 className="mb-6 text-xl font-light uppercase tracking-widest text-foreground">Contact Information</h2>
              <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border border-border bg-transparent px-4 text-sm focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  * Note: Real Stripe checkout will collect shipping and payment details securely. 
                  This is a simulated step.
                </p>
              </form>
            </div>

            <div className="lg:col-span-1 bg-muted p-8">
              <h2 className="mb-6 text-xl font-light uppercase tracking-widest text-foreground">Order Summary</h2>
              
              <div className="flex flex-col gap-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.id}`} className="flex gap-4">
                    <div className="relative h-20 w-16 overflow-hidden bg-background">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[0.6rem] text-background">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium line-clamp-1">{item.name}</span>
                      <span className="text-muted-foreground">{item.color} / {item.size}</span>
                      <span className="font-semibold">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-4 mb-8">
                <div className="flex justify-between text-lg font-semibold text-foreground">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || items.length === 0}
                className="w-full h-12 bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

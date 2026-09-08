import { useState, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChevronRight, Lock, MapPin, Truck, Box, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "ZA", name: "South Africa" },
  { code: "KE", name: "Kenya" },
];

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("US");
  const [zip, setZip] = useState("");

  const shippingCost = useMemo(() => {
    if (items.length === 0) return 0;
    if (country === "US") return 5.99;
    if (country === "CA") return 12.99;
    if (country === "GB" || country === "FR" || country === "DE") return 15.99;
    if (country === "KE" || country === "ZA") return 25.99;
    return 19.99; // Default international
  }, [country, items.length]);

  const shippingProvider = useMemo(() => {
    if (country === "US") return "FedEx Express";
    if (country === "KE" || country === "ZA") return "DHL Africa";
    return "DHL International";
  }, [country]);

  const total = subtotal + shippingCost;

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
          shipping: {
            name: `${firstName} ${lastName}`,
            address: {
              line1: address,
              city,
              country,
              postal_code: zip,
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to initiate checkout");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfb]">
      <SiteHeader />
      <main className="flex-1 pb-24 sm:">
        <div className="border-b border-border/60 bg-ink text-white">
          <div className="mx-auto flex max-w-[1540px] items-center justify-center gap-7 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.14em]">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-brand-soft" /> Secure encrypted checkout
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-14 lg:py-12">
          <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link to="/cart" className="hover:text-ink transition">
              Cart
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ink">Information & Shipping</span>
            <ChevronRight className="h-3 w-3" />
            <span>Payment</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-10">
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
                <section>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-5">
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-5 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand" /> Shipping Address
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Address
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        placeholder="Street address or P.O. Box"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Country / Region
                      </label>
                      <select
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        required
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  </div>
                </section>
                
                <section>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-5 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-brand" /> Shipping Method
                  </h2>
                  <div className="rounded-xl border border-brand bg-brand/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-4 rounded-full border-4 border-brand bg-white" />
                      <div>
                        <p className="font-bold text-sm text-ink">{shippingProvider}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">3-5 business days</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-ink">{formatPrice(shippingCost)}</span>
                  </div>
                </section>
              </form>
            </div>

            <div>
              <div className="sticky top-28 rounded-3xl border border-border/70 bg-white p-6 sm:p-8 shadow-[0_24px_60px_-38px_rgba(32,20,18,.5)]">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-6">
                  Order Summary
                </h2>

                <div className="flex flex-col gap-5 mb-8 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.id}`} className="flex gap-4">
                      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f4f1ed]">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 justify-center">
                        <span className="font-semibold text-sm line-clamp-2 text-ink">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {item.color} / {item.size}
                        </span>
                        <span className="font-bold text-sm text-ink mt-2">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-border/60 pt-6 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-semibold text-ink">{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-4 text-lg">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-ink">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing || items.length === 0}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-ink/90 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Continue to Payment"}
                </button>

                <div className="mt-6 flex flex-col gap-3 text-center text-[11px] font-semibold text-muted-foreground">
                  <p className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" /> Safe and secure payments
                  </p>
                  <p className="flex items-center justify-center gap-1.5">
                    <Box className="h-4 w-4 text-amber-600" /> 30-day return policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


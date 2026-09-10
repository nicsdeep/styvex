import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Lock, MapPin, Truck, Box, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { estimateShipping, DELIVERY_COPY } from "@/lib/store-policy";

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
  const { items, subtotal } = useCart();
  const { user } = useAuth();
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
    return estimateShipping(country, subtotal);
  }, [country, items.length, subtotal]);

  const shippingProvider = useMemo(() => {
    return country === "US" ? "Standard U.S. shipping" : "Standard international shipping";
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

      if (data?.url && new URL(data.url).hostname === "checkout.stripe.com") {
        window.location.href = data.url;
      } else {
        throw new Error("Payment is currently unavailable. Your bag has been saved; please try again later.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during checkout.");

    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfb]">
      <SiteHeader />
      <main className="flex-1 pb-24 pt-0">

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
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 [&_input]:h-11 [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:px-3 [&_input]:py-2 [&_input]:text-base [&_input::placeholder]:text-xs [&_select]:h-11 [&_select]:min-w-0 [&_select]:rounded-lg [&_select]:px-3 [&_select]:py-2 [&_select]:text-base [&_label]:block [&_label]:text-[11px] [&_label]:normal-case [&_label]:tracking-normal [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-lg">
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
                        placeholder="you@example.com" aria-label="Email address" autoComplete="email"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-5 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand" /> Shipping Address
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName} aria-label="First name" autoComplete="given-name"
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
                        value={lastName} aria-label="Last name" autoComplete="family-name"
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Address
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        placeholder="Street address" aria-label="Street address" autoComplete="street-address"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Country / Region
                      </label>
                      <select
                        required
                        value={country} aria-label="Country or region" autoComplete="country"
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
                        value={city} aria-label="City" autoComplete="address-level2"
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
                        value={zip} aria-label="Postal code" autoComplete="postal-code"
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
                        <p className="text-xs text-muted-foreground mt-0.5">Estimate · confirmed at payment</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-ink">{formatPrice(shippingCost)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{DELIVERY_COPY}</p>
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
                    <span>Estimated shipping</span>
                    <span className="font-semibold text-ink">{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-4 text-lg">
                    <span className="font-bold text-ink">Estimated total</span>
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
                    <CreditCard className="h-4 w-4 text-muted-foreground" /> Review charges before payment
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


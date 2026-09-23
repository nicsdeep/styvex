import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { ChevronRight, Lock, MapPin, Truck, Box, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DELIVERY_COPY } from "@/lib/store-policy";

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
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  
  const [postalCities, setPostalCities] = useState<string[]>([]);
  const [addressFound, setAddressFound] = useState(false);
  const [zipError, setZipError] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  // Quote State
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);

  // Zippopotam fallback for ZIP->City/State (smart ZIP)
  useEffect(() => {
    if (country === "US" && zip.trim().length >= 5) {
      if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
        setZipError("Invalid US ZIP code format (e.g., 90210)");
        setPostalCities([]);
        return;
      }
      const controller = new AbortController();
      fetch(`https://api.zippopotam.us/us/${zip.trim().slice(0,5)}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.places && data.places.length > 0) {
            const places = data.places as any[];
            const cities = Array.from(new Set(places.map(p => p["place name"])));
            setPostalCities(cities);
            setZipError("");
            if (!city || !cities.includes(city)) {
              setCity(cities[0]);
            }
            if (!state) setState(places[0]["state abbreviation"]);
          } else {
            setPostalCities([]);
            setZipError("ZIP code not found");
          }
        }).catch(() => {
          setZipError(""); // Ignore network errors so we don't hard block
        });
      return () => controller.abort();
    } else {
      setPostalCities([]);
      setZipError("");
    }
  }, [zip, country]);

  // Prepopulate if authenticated with a saved address (using orders as proxy for saved profile for now)
  useEffect(() => {
    if (user?.id) {
      supabase.from("orders").select("shipping_address").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single()
      .then(({ data }) => {
        if (data?.shipping_address) {
          const addr = data.shipping_address as any;
          if (addr.name) {
            const parts = addr.name.split(" ");
            setFirstName(parts[0]);
            setLastName(parts.slice(1).join(" "));
          }
          if (addr.address1) setAddress(addr.address1);
          if (addr.address2) setAddress2(addr.address2);
          if (addr.city) setCity(addr.city);
          if (addr.state_code) setState(addr.state_code);
          if (addr.zip) setZip(addr.zip);
          if (addr.phone) setPhone(addr.phone);
          if (addr.country_code) setCountry(addr.country_code);
        }
      });
    }
  }, [user?.id]);

  // Auto-calculate shipping when enough data is present
  useEffect(() => {
    if (items.length === 0) return;
    if ((country === "US" && !/^\d{5}$/.test(zip.trim())) || (country !== "US" && zip.trim().length < 3)) {
      setQuote(null);
      setShippingMethods([]);
      setSelectedShipping(null);
      return;
    }

    const controller = new AbortController();
    const fetchQuote = async () => {
      setQuoting(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: {
            mode: "quote",
            items,
            email: email || "guest@example.com",
            shipping: {
              name: `${firstName} ${lastName}`.trim(),
              address: { line1: address || "123 Main St", city: city || "City", state: state, postal_code: zip, country: country }
            }
          }
        });

        if (error) throw error;
        
          if (data && !controller.signal.aborted) {
            setQuote(data);
            const methods = [
              { id: "standard", name: "Standard Delivery", estimate: "5 - 9 business days", price: data.shipping }
            ];
            if (country === "US") {
              methods.push({ id: "express", name: "Express Delivery", estimate: "3 - 5 business days", price: data.shipping + 7.50 });
            }
            setShippingMethods(methods);
            if (selectedShipping === null || !methods.find(m => m.price === selectedShipping)) {
              setSelectedShipping(data.shipping);
            }
          }
        } catch (e) {
          console.error(e);
          setQuote(null);
          setShippingMethods([]);
          setSelectedShipping(null);
        } finally {
        if (!controller.signal.aborted) setQuoting(false);
      }
    };
    
    const timeout = setTimeout(fetchQuote, 800);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [zip, country, items, state]); // only trigger on zip, country, state, items changes for quotes


  const handleMapboxRetrieve = (res: any) => {
    const feature = res.features[0];
    if (feature && feature.properties) {
      const p = feature.properties;
      if (p.address_line1) setAddress(p.address_line1);
      if (p.address_line2) setAddress2(p.address_line2);
      if (p.place || p.city || p.locality) setCity(p.place || p.city || p.locality);
      if (p.region || p.state || p.province) setState(p.region || p.state || p.province);
      if (p.postcode) setZip(p.postcode);
      if (p.country) {
        const found = COUNTRIES.find(c => c.code === p.country || c.name === p.country);
        if (found) setCountry(found.code);
      }
      setAddressFound(true);
    }
  };

  const paymentProvider = import.meta.env.VITE_PAYMENT_PROVIDER || "stripe";
  const ctaText = paymentProvider === "mock" ? "Continue to Review" : "Continue to Payment";

  const total = subtotal + (selectedShipping || 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (zipError) {
      toast.error(zipError);
      return;
    }
    
    if (country === "US" && !addressFound && address.length < 5) {
      toast.error("Please select a valid address from the suggestions or provide a complete street address.");
      return;
    }

    if (!quote || selectedShipping === null) {
      toast.error("Please enter a valid shipping address to continue.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          items,
          email,
          quoteId: quote.quoteId,
          shipping: {
            name: `${firstName} ${lastName}`,
            address: {
              line1: address,
              line2: address2,
              city,
              state,
              country,
              postal_code: zip,
            },
            phone,
          },
        },
      });

      if (error) {
        const body = error.context ? await error.context.json().catch(() => null) : null;
        setQuote(null);
        throw new Error(body?.error || error.message || "Failed to initiate checkout");
      }

      if (data?.url && new URL(data.url).hostname === "checkout.stripe.com") {
        window.location.href = data.url;
      } else if (data?.url) {
        window.location.href = data.url; // Mock success url
      } else {
        throw new Error("Payment is currently unavailable.");
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
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      <SiteHeader />
      <main className="flex-1 pb-24 pt-0">
        <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-14 lg:py-12">
          
          <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link to="/cart" className="hover:text-ink transition">Cart</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ink">Information & Shipping</span>
            <ChevronRight className="h-3 w-3" />
            <span>Payment</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] items-start">
            
            {/* Left Column (Forms) */}
            <div className="space-y-10">
              <form
                id="checkout-form"
                onSubmit={handleCheckout}
                className="space-y-10 [&_input]:h-[46px] [&_input]:min-w-0 [&_input]:rounded-xl [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:bg-white [&_input]:border-[#e8e4db] [&_input::placeholder]:text-muted-foreground/60 [&_select]:h-[46px] [&_select]:min-w-0 [&_select]:rounded-xl [&_select]:px-4 [&_select]:py-3 [&_select]:text-sm [&_select]:bg-white [&_select]:border-[#e8e4db] [&_label]:block [&_label]:text-[11px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted-foreground [&_label]:mb-1.5"
              >
                {/* Contact Information */}
                <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#f0ebe1]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                      Contact Information
                    </h2>
                    {!user && (
                      <p className="text-xs text-muted-foreground">
                        Already have an account? <Link to="/account" className="text-ink font-bold hover:underline">Log in</Link>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={cn("w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink", touched.email && !email ? "border-red-400" : "")}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </section>

                {/* Shipping Address */}
                <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#f0ebe1]">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-6 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#8C3A3A]" /> Shipping Address
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    
                    <div className="col-span-2">
                      <label>Country / Region</label>
                      <select
                        required
                        value={country}
                        autoComplete="country-name"
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink appearance-none"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>First Name</label>
                      <input
                        type="text" required value={firstName}
                        autoComplete="given-name" onChange={(e) => setFirstName(e.target.value)}
                        className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>
                    <div>
                      <label>Last Name</label>
                      <input
                        type="text" required value={lastName}
                        autoComplete="family-name" onChange={(e) => setLastName(e.target.value)}
                        className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>

                    <div className="col-span-2 relative">
                      <label>Address</label>
                      <AddressAutocomplete onRetrieve={handleMapboxRetrieve}>
                        <input
                          type="text" required value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          autoComplete="address-line1" placeholder="Start typing your street address..."
                          className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                        />
                      </AddressAutocomplete>
                      {addressFound && (
                        <p className="mt-1.5 text-[11px] font-medium text-[#2E6B2E]">
                          ✓ Address found. Please add your apartment or unit number if applicable.
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label>Apartment, suite, etc. (optional)</label>
                      <input
                        type="text" value={address2}
                        autoComplete="address-line2" onChange={(e) => setAddress2(e.target.value)}
                        className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>

                    <div>
                      <label>City</label>
                      {postalCities.length > 1 ? (
                        <select
                          required value={city} autoComplete="address-level2"
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink appearance-none bg-white"
                        >
                          <option value="" disabled>Select your city...</option>
                          {postalCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text" required value={city}
                          autoComplete="address-level2" onChange={(e) => setCity(e.target.value)}
                          className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label>State / Prov</label>
                        <input
                          type="text" required={country === "US" || country === "CA"}
                          value={state} autoComplete="address-level1" onChange={(e) => setState(e.target.value)}
                          className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                        />
                      </div>
                      <div>
                        <label>Postal Code</label>
                        <input
                          type="text" required value={zip}
                          autoComplete="postal-code" onChange={(e) => setZip(e.target.value)}
                          className={cn("w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink", zipError ? "border-red-400" : "")}
                        />
                        {zipError && <p className="mt-1 text-[11px] text-red-500">{zipError}</p>}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label>Phone (optional)</label>
                      <input
                        type="tel" value={phone}
                        autoComplete="tel" onChange={(e) => setPhone(e.target.value)}
                        className="w-full transition focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                    </div>

                  </div>
                </section>

                {/* Shipping Method */}
                <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#f0ebe1]">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-5 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#8C3A3A]" /> Shipping Method
                  </h2>
                  
                  {quoting ? (
                    <div className="py-8 text-center text-sm font-medium text-muted-foreground animate-pulse">
                      Calculating delivery options...
                    </div>
                  ) : shippingMethods.length > 0 ? (
                    <div className="space-y-3">
                      {shippingMethods.map((method) => (
                        <label 
                          key={method.id} 
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all",
                            selectedShipping === method.price ? "border-[#8C3A3A] bg-[#8C3A3A]/5" : "border-[#e8e4db] hover:border-muted-foreground"
                          )}
                          onClick={() => setSelectedShipping(method.price)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", selectedShipping === method.price ? "border-[#8C3A3A]" : "border-[#e8e4db]")}>
                              {selectedShipping === method.price && <div className="h-2.5 w-2.5 rounded-full bg-[#8C3A3A]" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-ink">{method.name}</p>
                              <p className="text-[13px] text-muted-foreground mt-0.5">{method.estimate}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-sm text-ink">{formatPrice(method.price)}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#e8e4db] bg-[#FAF9F7] p-5 text-center text-[13px] text-muted-foreground">
                      Please enter your shipping address to calculate delivery options.
                    </div>
                  )}

                </section>
              </form>
            </div>

            {/* Right Column (Summary) */}
            <div className="sticky top-24">
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#f0ebe1]">
                <h2 className="font-display text-[26px] font-semibold tracking-tight text-ink mb-6">
                  Order Summary
                </h2>

                <div className="flex flex-col gap-5 mb-8 max-h-[350px] overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.id}`} className="flex gap-4">
                      <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border border-[#e8e4db] bg-[#F6F5F2]">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover mix-blend-multiply" />
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3C2A21] text-[10px] font-bold text-white shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 justify-center py-0.5">
                        <span className="font-semibold text-[13px] leading-tight text-ink line-clamp-2">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-1">
                          {item.color} / {item.size} • Qty {item.quantity}
                        </span>
                        <span className="font-bold text-[13px] text-ink mt-1.5">
                          {formatPrice(quote?.prices.find((p:any) => p.id === item.id)?.price ?? item.price)} each
                        </span>
                      </div>
                      <div className="font-bold text-[13px] text-ink flex items-end">
                         {formatPrice((quote?.prices.find((p:any) => p.id === item.id)?.price ?? item.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-[#f0ebe1] pt-6 text-[15px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink">
                      {formatPrice(quote?.subtotal ?? subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-semibold text-ink">
                      {selectedShipping === null ? "Enter delivery address" : formatPrice(selectedShipping)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#f0ebe1] pt-4 text-lg">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-ink">
                      {selectedShipping === null ? `${formatPrice(quote?.subtotal ?? subtotal)} + shipping` : formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing || quoting || selectedShipping === null || items.length === 0}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#3C2A21] py-4 text-[13px] font-extrabold uppercase tracking-widest text-white transition hover:bg-[#2A1D17] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {isProcessing ? "Processing..." : ctaText}
                </button>

                <div className="mt-6 flex flex-col gap-3 text-center text-[11px] font-semibold text-muted-foreground">
                  <p className="flex items-center justify-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> Review charges before payment
                  </p>
                  <p className="flex items-center justify-center gap-1.5">
                    <Box className="h-4 w-4" /> 30-day return policy
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

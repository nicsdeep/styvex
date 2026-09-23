import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, X, Heart, Truck, ShieldCheck, Box, ChevronDown, CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  
  const [country, setCountry] = useState("US");
  const [zip, setZip] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<{city: string, state: string} | null>(null);
  
  const [shippingQuote, setShippingQuote] = useState<any>(null);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(p);

  // Zippopotam lookup
  useEffect(() => {
    setDetectedLocation(null);
    if (country === "US" && /^\d{5}(-\d{4})?$/.test(zip.trim())) {
      const controller = new AbortController();
      fetch(`https://api.zippopotam.us/us/${zip.trim().slice(0,5)}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.places && data.places.length > 0) {
            setDetectedLocation({
              city: data.places[0]["place name"],
              state: data.places[0]["state abbreviation"]
            });
          }
        })
        .catch(() => {});
      return () => controller.abort();
    }
  }, [zip, country]);

  // Shipping Quote
  useEffect(() => {
    if (items.length === 0) return;
    if ((country === "US" && !/^\d{5}$/.test(zip.trim())) || (country !== "US" && zip.trim().length < 3)) {
      setShippingQuote(null);
      return;
    }

    const controller = new AbortController();
    const fetchQuote = async () => {
      setIsQuoting(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: {
            mode: "quote",
            items,
            email: "guest@example.com", // Guest placeholder
            shipping: {
              address: {
                country: country,
                postal_code: zip,
                state: detectedLocation?.state || ""
              }
            }
          }
        });

        if (error) throw error;
        
        if (data && !controller.signal.aborted) {
          setShippingQuote(data);
          // Create 2 mock options based on the returned customer_shipping price (or 1 if international)
          // Since the backend returns a single rate, we present it as 'Standard', and maybe an 'Express' mock if US
          const methods = [
            { id: "standard", name: "Standard Delivery", estimate: "5 - 9 business days", price: data.shipping }
          ];
          if (country === "US") {
            methods.push({ id: "express", name: "Express Delivery", estimate: "3 - 5 business days", price: data.shipping + 7.50 });
          }
          setShippingMethods(methods);
          setSelectedShipping(data.shipping);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!controller.signal.aborted) setIsQuoting(false);
      }
    };
    
    const timeout = setTimeout(fetchQuote, 800);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [zip, country, items, detectedLocation?.state]);

  const total = subtotal + (selectedShipping || 0);
  const tax = subtotal * 0.0825; // Simple mockup for tax UI parity
  const estimatedTotal = subtotal + tax + (selectedShipping || 0);
  const freeShippingThreshold = 600;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      <SiteHeader />
      <main className="flex-1 pb-24">
        <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-14 lg:py-12">
          
          <nav className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link to="/" className="hover:text-ink transition">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink">Cart</span>
          </nav>

          <h1 className="mb-4 font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Your Shopping Bag {items.length > 0 && `(${items.length})`}
          </h1>

          <div className="mb-10 flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium text-ink">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#8C3A3A]" /> Free shipping on orders over $600</span>
            <span className="flex items-center gap-2"><Box className="h-4 w-4 text-[#8C3A3A]" /> 30-day return policy</span>
            <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#8C3A3A]" /> Secure checkout</span>
          </div>

          {items.length === 0 ? (
             <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
               <p className="mb-6 text-muted-foreground">Your bag is currently empty.</p>
               <Link to="/shop" className="flex items-center justify-center gap-2 rounded-xl bg-ink px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-ink/90 active:scale-[.98]">
                 Continue Shopping
               </Link>
             </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] items-start">
              
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                
                {/* Product Card */}
                {items.map((item) => (
                  <div key={item.id} className="relative flex flex-col gap-5 rounded-3xl bg-white p-5 sm:flex-row sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#f0ebe1]">
                    <button onClick={() => removeItem(item.id)} className="absolute right-4 top-4 text-muted-foreground hover:text-ink">
                      <X className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                    
                    <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-[#F6F5F2] sm:w-[160px]">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover mix-blend-multiply" />}
                    </div>

                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="pr-8">
                        <Link to={`/product/${item.slug}` as any} className="font-semibold text-[17px] leading-tight text-ink hover:text-[#8C3A3A] transition">
                          {item.name}
                        </Link>
                        <div className="mt-1.5 text-[13px] text-muted-foreground">
                          {item.color} / {item.size}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8F3E8] px-2.5 py-0.5 text-[11px] font-bold text-[#2E6B2E]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2E6B2E]" /> In stock
                        </div>
                      </div>

                      <div className="mt-6 flex items-end justify-between">
                        <div className="flex flex-col gap-3">
                          <span className="font-semibold text-ink">{formatPrice(item.price)} each</span>
                          <div className="flex items-center gap-4 text-[13px] font-medium text-muted-foreground">
                            <button onClick={() => removeItem(item.id)} className="flex items-center gap-1.5 hover:text-[#8C3A3A] transition">
                              <span className="text-[#8C3A3A]">🗑</span> Remove
                            </button>
                            <button className="flex items-center gap-1.5 hover:text-[#8C3A3A] transition">
                              <Heart className="h-4 w-4 text-[#8C3A3A]" /> Save for later
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-5">
                          <div className="flex items-center rounded-xl border border-[#e8e4db] bg-white">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-ink disabled:opacity-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center text-[15px] font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.inventory_quantity}
                              className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-ink disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="font-bold text-xl text-ink">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Estimate Delivery Card */}
                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#f0ebe1]">
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink mb-2">
                    <Truck className="h-5 w-5 text-[#8C3A3A]" /> Estimate delivery & shipping
                  </h2>
                  <p className="text-[13px] text-muted-foreground mb-6">
                    Enter your destination to see available shipping options.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Country / Region</label>
                      <div className="relative">
                        <select 
                          value={country} onChange={e => {setCountry(e.target.value); setZip("");}}
                          className="w-full appearance-none rounded-xl border border-[#e8e4db] bg-white pl-10 pr-10 py-3 text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                        >
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🇺🇸</span>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">ZIP Code</label>
                      <div className="relative">
                        <input
                          type="text" value={zip} onChange={e => setZip(e.target.value)}
                          className="w-full rounded-xl border border-[#e8e4db] bg-white pl-10 pr-10 py-3 text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                          placeholder="ZIP"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2"><MapPinIcon className="h-4 w-4 text-muted-foreground" /></span>
                        {zip.length >= 5 && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#2E6B2E]" />}
                      </div>
                    </div>
                  </div>

                  {detectedLocation && (
                    <div className="mb-6 flex items-center justify-between rounded-xl bg-[#E8F3E8]/50 px-4 py-3 border border-[#E8F3E8]">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-[#2E6B2E]">
                        <MapPinIcon className="h-4 w-4" /> Delivery to {detectedLocation.city}, {detectedLocation.state} {zip}
                      </div>
                      <button className="text-[13px] font-medium text-[#2E6B2E] underline underline-offset-2">Change</button>
                    </div>
                  )}

                  {isQuoting ? (
                    <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">Calculating delivery options...</div>
                  ) : shippingMethods.length > 0 ? (
                    <div className="space-y-3">
                      {shippingMethods.map((method, idx) => (
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
                  ) : null}

                  <p className="mt-5 flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
                    <span className="mt-0.5">ⓘ</span> Delivery times are estimates and may vary by destination and supplier.
                  </p>
                </div>

                <div className="flex px-2">
                  <Link to="/shop" className="flex items-center gap-1.5 text-[13px] font-semibold text-ink hover:text-[#8C3A3A] transition">
                    <ChevronRight className="h-4 w-4 rotate-180" /> Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="sticky top-24">
                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#f0ebe1]">
                  <h2 className="font-display text-[26px] font-semibold tracking-tight text-ink mb-6">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-4 text-[15px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({items.reduce((a,b)=>a+b.quantity,0)} items)</span>
                      <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className="font-semibold text-ink">{selectedShipping !== null ? formatPrice(selectedShipping) : '—'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">Estimated tax ⓘ</span>
                      <span className="font-semibold text-ink">{selectedShipping !== null ? formatPrice(tax) : '—'}</span>
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-[#f0ebe1] text-xl mt-2">
                      <span className="font-bold text-ink">Estimated total</span>
                      <span className="font-extrabold text-ink">{selectedShipping !== null ? formatPrice(estimatedTotal) : formatPrice(subtotal)}</span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#3C2A21] py-4 text-[13px] font-extrabold uppercase tracking-widest text-white transition hover:bg-[#2A1D17] active:scale-[.98]"
                  >
                    Proceed to Checkout <ChevronRight className="h-4 w-4" />
                  </Link>
                  
                  <p className="mt-4 flex justify-center items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Lock className="h-3 w-3" /> Secure checkout • No account required
                  </p>

                  <div className="mt-8 rounded-2xl bg-[#FAF9F7] p-5 border border-[#f0ebe1]">
                    {remainingForFreeShipping > 0 ? (
                      <>
                        <p className="mb-3 text-[13px] font-bold text-ink flex items-center gap-2">
                          <span className="text-[#8C3A3A]">🏷</span> Add {formatPrice(remainingForFreeShipping)} more for free shipping!
                        </p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E0D8]">
                          <div className="h-full bg-[#8C3A3A] transition-all duration-500" style={{ width: `${freeShippingPercent}%` }} />
                        </div>
                        <p className="mt-2 text-right text-[11px] font-semibold text-muted-foreground">
                          {formatPrice(subtotal)} / {formatPrice(freeShippingThreshold)}
                        </p>
                      </>
                    ) : (
                      <p className="text-[13px] font-bold text-[#2E6B2E] flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> You've unlocked free standard shipping!
                      </p>
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[#f0ebe1] pt-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Truck className="h-5 w-5 text-[#8C3A3A]" />
                      <span className="text-[10px] font-semibold leading-tight text-muted-foreground">Free shipping<br/>on orders over $600</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Box className="h-5 w-5 text-[#8C3A3A]" />
                      <span className="text-[10px] font-semibold leading-tight text-muted-foreground">30-day<br/>return policy</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <ShieldCheck className="h-5 w-5 text-[#8C3A3A]" />
                      <span className="text-[10px] font-semibold leading-tight text-muted-foreground">Secure<br/>checkout</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

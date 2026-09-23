import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AddressAssistance } from '@/components/address-assistance';
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
  useEffect(()=>{
    try {
      const draft=JSON.parse(sessionStorage.getItem('styvex-checkout-draft') || 'null');
      sessionStorage.removeItem('styvex-checkout-draft');
      if (!draft || Date.now()-draft.savedAt>30*60*1000) return;
      const values=draft.values;
      [setEmail,setFirstName,setLastName,setAddress,setAddress2,setCity,setState,setCountry,setZip,setPhone].forEach((setter,i)=>{if(typeof values[i]==='string') setter(values[i]);});
    } catch { /* Manual entry remains available. */ }
  },[]);
  useEffect(()=>{if(user?.email) setEmail(current=>current || user.email || '');},[user?.email]);
  const signInForCheckout=()=>{
    sessionStorage.setItem('styvex-checkout-draft',JSON.stringify({savedAt:Date.now(),values:[email,firstName,lastName,address,address2,city,state,country,zip,phone]}));
    sessionStorage.setItem('styvex-return-to','/checkout');
    void navigate({to:'/account'});
  };
  const checkoutToken=async()=>{
    let {data:{session}}=await supabase.auth.getSession();
    if(session && (session.expires_at || 0)*1000<Date.now()+60000) {
      const refreshed=await supabase.auth.refreshSession(); session=refreshed.data.session;
    }
    if(!session) {signInForCheckout();throw new Error('Please sign in to calculate shipping. Your address has been saved for your return.');}
    return session.access_token;
  };

  const [quote, setQuote] = useState<{
    quoteId: string;
    expiresAt: string;
    subtotal: number;
    shipping: number;
    total: number;
    prices: { id: string; price: number }[];
    key: string;
  } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const shipping = {
    name: `${firstName} ${lastName}`,
    address: { line1: address, line2: address2, city, state, country, postal_code: zip },
    phone,
  };
  const quoteKey = JSON.stringify({ items, email, shipping });
  const validQuote =
    quote?.key === quoteKey && Date.parse(quote.expiresAt) > Date.now() ? quote : null;
  const shippingCost = validQuote?.shipping;
  const calculateShipping = async () => {
    setQuoting(true);
    setQuote(null);
    try {
      const token=await checkoutToken();
      if (!(document.getElementById('checkout-form') as HTMLFormElement)?.reportValidity()) return;
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        headers:{Authorization:`Bearer ${token}`},
        body: { mode: "quote", items, email, shipping },
      });
      if (error || !data?.quoteId) {
        const body = error?.context ? await error.context.json().catch(() => null) : null;
        if(error?.context?.status===401 || body?.error==='Unauthorized') {signInForCheckout();throw new Error('Your session has expired. Please sign in again; your address is saved.');}
        throw new Error(
          body?.error ||
            data?.error ||
            "Unable to calculate shipping. Check your address and sign in.",
        );
      }
      setQuote({ ...data, key: quoteKey });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Shipping unavailable.");
    } finally {
      setQuoting(false);
    }
  };

  const shippingProvider = useMemo(() => {
    return country === "US" ? "Standard U.S. shipping" : "Standard international shipping";
  }, [country]);

  const total = validQuote?.total;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validQuote) {
      toast.error("Calculate shipping and review the total first.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const token=await checkoutToken();
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        headers:{Authorization:`Bearer ${token}`},
        body: {
          items,
          email,
          quoteId: validQuote.quoteId,
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
      } else {
        throw new Error(
          "Payment is currently unavailable. Your bag has been saved; please try again later.",
        );
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
              <form
                id="checkout-form"
                onSubmit={handleCheckout}
                className="space-y-6 [&_input]:h-11 [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:px-3 [&_input]:py-2 [&_input]:text-base [&_input::placeholder]:text-xs [&_select]:h-11 [&_select]:min-w-0 [&_select]:rounded-lg [&_select]:px-3 [&_select]:py-2 [&_select]:text-base [&_label]:block [&_label]:text-[11px] [&_label]:normal-case [&_label]:tracking-normal [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-lg"
              >
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
                        aria-label="Email address"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink mb-5 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand" /> Shipping Address
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><AddressAssistance country={country} zip={zip} onChoose={value=>{
                      if(value.street) setAddress(value.street);
                      if(value.city) setCity(value.city);
                      if(value.state) setState(value.state);
                      if(value.zip) setZip(value.zip);
                    }} onPostal={value=>{if(value.city) setCity(current=>current || value.city!);if(value.state) setState(current=>current || value.state!);}}/></div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        aria-label="First name"
                        autoComplete="given-name"
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
                        aria-label="Last name"
                        autoComplete="family-name"
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
                        placeholder="Street address"
                        aria-label="Street address"
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Country / Region
                      </label>
                      <select
                        required
                        value={country}
                        aria-label="Country or region"
                        autoComplete="country"
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
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        value={address2}
                        aria-label="Apartment, suite, or unit"
                        autoComplete="address-line2"
                        onChange={(e) => setAddress2(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        aria-label="City"
                        autoComplete="address-level2"
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        State / Province
                      </label>
                      <input
                        type="text"
                        required={country === "US" || country === "CA"}
                        value={state}
                        aria-label="State or province"
                        autoComplete="address-level1"
                        onChange={(e) => setState(e.target.value)}
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
                        aria-label="Postal code"
                        autoComplete="postal-code"
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        aria-label="Phone number"
                        autoComplete="tel"
                        onChange={(e) => setPhone(e.target.value)}
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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {validQuote
                            ? "Rechecked before payment"
                            : "Enter your address to calculate shipping"}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-ink">
                      {shippingCost == null ? "—" : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{DELIVERY_COPY}</p>
                  <button
                    type="button"
                    onClick={calculateShipping}
                    disabled={quoting || isProcessing || !items.length}
                    className="mt-3 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {quoting ? "Calculating…" : !user ? "Sign in to calculate shipping" : "Calculate shipping"}
                  </button>
                  {!user && (
                    <p className="mt-2 text-sm">
                      <Link to="/account" className="underline">
                        Sign in
                      </Link>{" "}
                      to calculate shipping and check out.
                    </p>
                  )}
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
                          {formatPrice(
                            validQuote?.prices.find((p) => p.id === item.id)?.price ?? item.price,
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-border/60 pt-6 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink">
                      {formatPrice(validQuote?.subtotal ?? subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-semibold text-ink">
                      {shippingCost == null ? "Calculate shipping" : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-4 text-lg">
                    <span className="font-bold text-ink">Total</span>
                    <span className="font-extrabold text-ink">
                      {total == null ? "—" : formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing || quoting || !validQuote || items.length === 0}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-ink/90 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Continue to Payment"}
                </button>

                <div className="mt-6 flex flex-col gap-3 text-center text-[11px] font-semibold text-muted-foreground">
                  <p className="flex items-center justify-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-muted-foreground" /> Review charges before
                    payment
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

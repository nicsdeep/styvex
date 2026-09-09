import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, X, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(p);

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfb]">
      <SiteHeader />
      <main className="flex-1 pb-24">
        <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-14 lg:py-12">
          <h1 className="mb-8 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Your Shopping Bag
          </h1>

          {items.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-border/60 bg-white py-20 text-center shadow-sm">
              <p className="mb-6 text-muted-foreground">Your bag is currently empty.</p>
              <Link
                to="/shop"
                className="flex items-center justify-center gap-2 rounded-xl bg-ink px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-ink/90 active:scale-[.98]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
              {/* Cart Items List */}
              <div className="flex flex-col gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"
                  >
                    
                    {/* Product Image */}
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f4f1ed] sm:w-32">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-secondary/30" />
                      )}
                    </div>

                    {/* Product Details & Controls */}
                    <div className="flex flex-1 flex-col justify-between sm:ml-4">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link to={`/product/${item.slug}` as any} className="font-semibold text-sm line-clamp-2 text-ink hover:text-brand transition">
                            {item.name}
                          </Link>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.color && <span>{item.color}</span>}
                            {item.color && item.size && <span> / </span>}
                            {item.size && <span>{item.size}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-ink block sm:hidden">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="mt-1 text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
                            aria-label="Remove item"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between sm:mt-6">
                        <div className="flex items-center gap-3 rounded-full border border-border/80 bg-background px-1 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.inventory_quantity}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="hidden text-right font-bold text-sm text-ink sm:block">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <div className="sticky top-28 rounded-3xl border border-border/70 bg-white p-6 sm:p-8 luxury-shadow">
                  <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-ink">
                    Order Summary
                  </h2>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between text-muted-foreground border-b border-border/50 pb-4">
                      <span>Subtotal</span>
                      <span className="font-medium text-ink">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground border-b border-border/50 pb-4">
                      <span>Shipping</span>
                      <span className="font-medium">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between pt-2 text-lg">
                      <span className="font-bold text-ink">Total</span>
                      <span className="font-extrabold text-ink">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                  
                  <Link
                    to="/checkout"
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-ink/90 active:scale-[.98]"
                  >
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center text-[11px] font-semibold text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-brand-soft" /> Secure encrypted checkout
                    </p>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { Minus, Plus, X } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-12 lg:px-24">
          <h1 className="mb-10 text-3xl font-light uppercase tracking-widest text-foreground">
            Shopping Cart
          </h1>

          {items.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center border-t border-border/50 py-20 text-center">
              <p className="mb-6 text-muted-foreground">Your cart is currently empty.</p>
              <Link
                to="/shop"
                className="bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              {/* Cart Items List */}
              <div className="lg:col-span-8">
                <div className="hidden grid-cols-12 border-b border-border/50 pb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground md:grid">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-3 text-center">Quantity</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>

                <div className="flex flex-col">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-4 border-b border-border/50 py-8 md:grid-cols-12 md:items-center">
                      
                      {/* Product Info */}
                      <div className="col-span-6 flex gap-6">
                        <div className="h-32 w-24 shrink-0 bg-muted">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-secondary/30" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <Link to={`/product/${item.slug}`} className="text-sm font-medium hover:underline">
                            {item.name}
                          </Link>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {item.color && <span>{item.color}</span>}
                            {item.color && item.size && <span> / </span>}
                            {item.size && <span>{item.size}</span>}
                          </div>
                          <div className="mt-2 text-sm md:hidden">
                            {formatPrice(item.price)}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground md:hidden"
                          >
                            <X className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="col-span-3 flex items-center md:justify-center">
                        <div className="flex h-10 w-32 items-center justify-between border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.inventory_quantity}
                            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-4 hidden text-muted-foreground hover:text-foreground md:block"
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="hidden col-span-3 text-right text-sm font-medium md:block">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4">
                <div className="bg-muted p-8">
                  <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
                    Order Summary
                  </h2>
                  <div className="flex flex-col gap-4 text-sm">
                    <div className="flex justify-between border-b border-border/50 pb-4">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-4">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold uppercase tracking-wider">Total</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                  
                  <Link
                    to="/checkout"
                    className="mt-8 flex w-full justify-center bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
                  >
                    Proceed to Checkout
                  </Link>
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

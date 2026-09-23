import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Package, Truck, CreditCard, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/account/orders/$id")({
  component: OrderDetailsPage,
});

function OrderDetailsPage() {
  const { id } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate({ to: "/account", replace: true });
    return null;
  }

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      // Also fetch shipment info and payments if we have those tables 
      // (ignoring for now if they don't strictly exist or have rows yet to prevent errors, 
      // we'll rely on the snapshot fields we have in the main order).
      
      return data as any;
    },
    enabled: !!user && !!id,
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfb]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-24 pt-8 md:px-10 lg:pt-12">
        <Link 
          to="/account/orders" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-ink transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Orders
        </Link>
        
        {isLoading || authLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Loading order details...</p>
          </div>
        ) : !order ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4">
            <p className="text-muted-foreground">Order not found.</p>
            <Link to="/account/orders" className="text-brand hover:underline">Return to order history</Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                  Order {order.id.split('-')[0].toUpperCase()}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Payment: {order.payment_status}
                </span>
                <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand">
                  Status: {order.status === "paid" ? "Processing" : order.status}
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                    <Package className="h-5 w-5 text-muted-foreground" /> Items
                  </h2>
                  <div className="divide-y divide-border/40">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-1 flex-col justify-center">
                          <p className="font-semibold text-sm text-ink">{item.product_name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty: {item.quantity} 
                            {item.supplier ? ` • Supplier: ${item.supplier}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-col justify-center items-end">
                          <p className="font-bold text-sm text-ink">
                            {formatPrice((item.price || item.unit_price || 0) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                    <Truck className="h-5 w-5 text-muted-foreground" /> Fulfillment
                  </h2>
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Status: <span className="font-semibold capitalize text-ink">{order.fulfillment_status || 'Unsubmitted'}</span>
                    </p>
                    {order.fulfillment_provider && (
                      <p className="mt-2 text-muted-foreground">
                        Provider: <span className="font-semibold text-ink">{order.fulfillment_provider}</span>
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                    <CreditCard className="h-5 w-5 text-muted-foreground" /> Summary
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium text-ink">{formatPrice(order.subtotal_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className="font-medium text-ink">{formatPrice(order.shipping_amount || 0)}</span>
                    </div>
                    {(order.tax || 0) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span className="font-medium text-ink">{formatPrice(order.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border/40 pt-3 text-base font-bold text-ink">
                      <span>Total</span>
                      <span>{formatPrice(order.total_amount || 0)}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                    <MapPin className="h-5 w-5 text-muted-foreground" /> Shipping Address
                  </h2>
                  {order.shipping_address ? (
                    <address className="not-italic text-sm text-muted-foreground space-y-1">
                      <p className="font-semibold text-ink">{(order.shipping_address as any).name}</p>
                      <p>{(order.shipping_address as any).address1}</p>
                      {(order.shipping_address as any).address2 && <p>{(order.shipping_address as any).address2}</p>}
                      <p>
                        {(order.shipping_address as any).city}, {(order.shipping_address as any).state_code} {(order.shipping_address as any).zip}
                      </p>
                      <p>{(order.shipping_address as any).country_code}</p>
                    </address>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shipping address provided.</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

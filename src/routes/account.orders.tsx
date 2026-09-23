import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package, ChevronRight } from "lucide-react";


export const Route = createFileRoute("/account/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // If unauthenticated, redirect to account
  if (!isLoading && !user) {
    navigate({ to: "/account", replace: true });
    return null;
  }

  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders" as any)
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16 pt-12">
        <h1 className="text-3xl font-semibold">Order History</h1>
        <p className="mt-2 text-muted-foreground">
          View your recent orders and their status.
        </p>

        {isOrdersLoading || isLoading ? (
          <p className="mt-8" role="status">Loading orders...</p>
        ) : orders && orders.length > 0 ? (
          <div className="mt-8 space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="group rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
                  <div>
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Order Number</p>
                    <p className="font-mono text-sm text-ink">{order.id.split('-')[0]}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="text-sm font-bold text-ink">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold capitalize text-neutral-800">
                      Payment: {order.payment_status}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold capitalize text-brand">
                      {order.status === "paid" ? "Processing" : order.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" /> Items ({order.order_items.length})
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="text-xs bg-neutral-50 border border-neutral-100 rounded-md px-3 py-2 flex items-center gap-2">
                          <span className="font-medium">{item.quantity}x</span>
                          <span className="truncate max-w-[150px]">{item.product_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Link 
                    to={`/account/orders/${order.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition hover:bg-neutral-50 sm:shrink-0"
                  >
                    View Details <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
            <a href="/shop" className="mt-4 inline-block bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium">
              Start Shopping
            </a>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

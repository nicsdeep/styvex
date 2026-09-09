import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";


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
              <div key={order.id} className="rounded-lg border border-border p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{order.id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Date</p>
                    <p>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-neutral-800">
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-4">Items</h3>
                  <div className="space-y-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
                        <span>{item.quantity} x {item.product_name}</span>
                        <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
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

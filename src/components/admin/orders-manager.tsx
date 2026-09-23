import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrderDetailsModal } from "./order-details-modal";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-border/60 bg-white px-4 py-2.5 text-sm transition focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";
const buttonOutline =
  "inline-flex items-center justify-center rounded-lg border-2 border-border/80 bg-white px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-violet-600 hover:text-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export function OrdersManager() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-orders", page, search],
    queryFn: async () => {
      let request = supabase
        .from("orders")
        .select(`*, order_items (*)`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * 20, page * 20 + 19);

      if (search) {
        request = request.eq("id", search.trim());
      }

      const { data, error, count } = await request;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-violet-950">Orders</h2>
        <p className="text-muted-foreground mt-2 text-sm">Manage and fulfill customer orders.</p>
      </header>

      <div className="rounded-xl border border-border/50 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border/50 bg-violet-50/50">
          <form
            className="flex gap-3 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
              setPage(0);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                className={cn(input, "pl-11 py-3")}
                name="search"
                aria-label="Search orders by ID"
                placeholder="Search Order ID..."
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-lg bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100">
              Search
            </button>
          </form>
        </div>

        {query.isPending ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : query.isError ? (
          <div className="p-12 text-center text-red-500 font-semibold">
            Unable to load records.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f6f7fb]">
                  <tr>
                    <th className="p-4 font-semibold text-violet-950">Order ID & Date</th>
                    <th className="p-4 font-semibold text-violet-950">Customer</th>
                    <th className="p-4 font-semibold text-violet-950">Amount</th>
                    <th className="p-4 font-semibold text-violet-950">Status</th>
                    <th className="p-4 font-semibold text-violet-950 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {query.data.rows?.map((order: any) => (
                    <tr key={order.id} className="align-middle hover:bg-violet-50/30 transition">
                      <td className="p-4">
                        <code className="block text-xs font-medium text-muted-foreground px-2 py-1 bg-muted/50 rounded-lg inline-block select-all mb-1">
                          {order.id.split('-')[0]}
                        </code>
                        <p className="font-medium text-foreground text-xs">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium">{order.customer_email || 'No email'}</p>
                      </td>
                      <td className="p-4 font-bold text-violet-950 text-base">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-800">
                            Pay: {order.payment_status}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            {order.status === "paid" ? "Processing" : order.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          className="text-violet-600 font-bold hover:text-violet-700 underline underline-offset-4"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!query.data.rows?.length && (
                <div className="p-12 text-center text-muted-foreground font-semibold">
                  No orders found.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border/50 bg-[#f6f7fb] flex items-center justify-between">
              <button
                className={buttonOutline}
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <p className="text-sm font-semibold text-muted-foreground">
                Page {page + 1} of {Math.ceil(query.data.count / 20) || 1}
              </p>
              <button
                className={buttonOutline}
                disabled={(page + 1) * 20 >= query.data.count}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {selectedOrderId && (
        <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </section>
  );
}

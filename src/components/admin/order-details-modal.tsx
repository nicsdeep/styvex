import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { X, Package, Truck, CreditCard, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";

const button =
  "inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 shadow-sm shadow-violet-900/20";
const buttonOutline =
  "inline-flex items-center justify-center rounded-lg border border-border/80 bg-white px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export function OrderDetailsModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; title: string; desc: string; handler: () => void } | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("id", orderId)
        .single();
      if (error) throw error;

      // Ideally we would fetch history, shipments, etc. here as well
      const { data: history } = await supabase.from("order_status_history").select("*").eq("order_id", orderId).order("created_at", { ascending: false });

      return { ...data, history: history || [] };
    },
  });

  // Handle ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="rounded-2xl bg-white p-8 shadow-2xl flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-violet-600" />
        <p className="font-semibold text-muted-foreground">Loading order...</p>
      </div>
    </div>
  );

  if (isError || !order) return null;

  const updateStatus = async (newStatus: string, note: string, extraUpdates: any = {}) => {
    setBusy(true);
    try {
      // 1. Update order status
      const { error } = await supabase.from("orders").update({ status: newStatus, ...extraUpdates }).eq("id", orderId);
      if (error) throw error;
      
      // 2. Add history record
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        previous_status: order.status,
        new_status: newStatus,
        notes: note,
      });

      await client.invalidateQueries();
      toast.success("Order updated successfully");
      setConfirmAction(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setBusy(false);
    }
  };

  const handleMockPayment = () => {
    setConfirmAction({
      type: "payment",
      title: "Confirm Mock Payment",
      desc: "This will immediately mark the order as paid and transition it to processing. This simulates a successful checkout capture.",
      handler: () => updateStatus("paid", "Admin confirmed mock payment manually", { payment_status: "paid" })
    });
  };

  const handleMarkShipped = () => {
    if (!trackingNumber || !carrier) {
      toast.error("Please enter a tracking number and carrier first.");
      return;
    }
    setConfirmAction({
      type: "ship",
      title: "Mark as Shipped",
      desc: `This will mark the order as shipped via ${carrier} with tracking ${trackingNumber}.`,
      handler: async () => {
        setBusy(true);
        try {
          await supabase.from("shipments").insert({
            order_id: orderId,
            carrier,
            tracking_number: trackingNumber,
            status: "shipped",
            shipped_at: new Date().toISOString()
          });
          await updateStatus("shipped", `Shipped via ${carrier} (Tracking: ${trackingNumber})`);
        } finally {
          setBusy(false);
        }
      }
    });
  };

  const handleMarkDelivered = () => {
    setConfirmAction({
      type: "deliver",
      title: "Mark as Delivered",
      desc: "This will complete the order fulfillment.",
      handler: () => updateStatus("delivered", "Marked as delivered by admin")
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-violet-950">Order {order.id.split('-')[0]}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Placed {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100 transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              {/* Order Status Ribbon */}
              <div className="rounded-xl border border-border/50 bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Status</p>
                  <p className="text-lg font-bold capitalize text-violet-950">{order.status === "paid" ? "Processing" : order.status}</p>
                </div>
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <button onClick={handleMockPayment} className={buttonOutline}>Confirm Mock Payment</button>
                  )}
                  {order.status === "paid" && (
                     <div className="flex items-center gap-2">
                        <input 
                          placeholder="Carrier (e.g. USPS)" 
                          className="h-10 rounded-lg border px-3 text-sm"
                          value={carrier} onChange={e=>setCarrier(e.target.value)}
                        />
                        <input 
                          placeholder="Tracking #..." 
                          className="h-10 rounded-lg border px-3 text-sm"
                          value={trackingNumber} onChange={e=>setTrackingNumber(e.target.value)}
                        />
                        <button onClick={handleMarkShipped} className={button}>Mark Shipped</button>
                     </div>
                  )}
                  {order.status === "shipped" && (
                    <button onClick={handleMarkDelivered} className={button}>Mark Delivered</button>
                  )}
                </div>
              </div>

              {/* Items */}
              <section className="rounded-xl border border-border/50 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-violet-950">
                  <Package className="h-4 w-4" /> Order Items ({order.order_items.length})
                </h3>
                <div className="divide-y divide-border/40">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-1 flex-col justify-center">
                        <p className="font-semibold text-sm text-foreground">{item.product_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity} • {item.supplier}</p>
                      </div>
                      <div className="flex flex-col justify-center items-end">
                        <p className="font-bold text-sm text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* History */}
              <section className="rounded-xl border border-border/50 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-violet-950">
                  <Clock className="h-4 w-4" /> Status History
                </h3>
                <div className="space-y-4">
                  {order.history?.map((entry: any) => (
                    <div key={entry.id} className="flex gap-4 text-sm">
                      <div className="w-1/4 text-muted-foreground text-xs">{new Date(entry.created_at).toLocaleString()}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground capitalize">{entry.new_status}</p>
                        {entry.notes && <p className="text-muted-foreground mt-0.5 text-xs">{entry.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {order.history?.length === 0 && <p className="text-sm text-muted-foreground">No history recorded.</p>}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              {/* Customer info */}
              <section className="rounded-xl border border-border/50 bg-white p-5 shadow-sm text-sm">
                <h3 className="mb-3 font-bold text-violet-950">Customer</h3>
                <p className="font-medium text-foreground">{order.customer_email || 'No email'}</p>
              </section>

              {/* Address */}
              <section className="rounded-xl border border-border/50 bg-white p-5 shadow-sm text-sm">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-violet-950">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h3>
                {order.shipping_address ? (
                  <address className="not-italic text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">{(order.shipping_address as any).name}</p>
                    <p>{(order.shipping_address as any).address1}</p>
                    {(order.shipping_address as any).address2 && <p>{(order.shipping_address as any).address2}</p>}
                    <p>{(order.shipping_address as any).city}, {(order.shipping_address as any).state_code} {(order.shipping_address as any).zip}</p>
                    <p>{(order.shipping_address as any).country_code}</p>
                  </address>
                ) : (
                  <p className="text-muted-foreground">No address</p>
                )}
              </section>

              {/* Financials */}
              <section className="rounded-xl border border-border/50 bg-white p-5 shadow-sm text-sm">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-violet-950">
                  <CreditCard className="h-4 w-4" /> Summary
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">${Number(order.subtotal_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-foreground">${Number(order.shipping_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2 text-base font-bold text-violet-950 mt-2">
                    <span>Total</span>
                    <span>${Number(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-violet-950 mb-2">{confirmAction.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{confirmAction.desc}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} disabled={busy} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={confirmAction.handler} disabled={busy} className={button}>{busy ? "Processing..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

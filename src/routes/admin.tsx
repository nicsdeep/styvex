import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Box, Image as ImageIcon, LayoutDashboard, Settings, ShoppingCart, Tag, Search, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const input = "w-full rounded-2xl border border-border/60 bg-white px-4 py-3.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const button = "inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 shadow-sm shadow-emerald-900/20";
const buttonSecondary = "inline-flex items-center justify-center rounded-2xl bg-emerald-50 px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";
const buttonOutline = "inline-flex items-center justify-center rounded-2xl border-2 border-border/80 bg-white px-6 py-3.5 text-sm font-bold text-foreground transition hover:border-emerald-600 hover:text-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

const logos = [
  "styvex_logo2",
  "styvex_logo",
  "styvex-brand-primary",
  "styvex-brand-accent",
  "styvex-brand-monochrome",
  "styvex-brand-inverse",
  "styvex-footer-white",
  "styvex-footer-soft",
  "styvex-footer-muted",
];

type Table = "products" | "categories" | "product_variants" | "product_images";
type Field = { key: string; label: string; type?: string; required?: boolean };

const fields: Record<Table, Field[]> = {
  products: [
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "URL slug", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "price", label: "Price (USD)", type: "number", required: true },
    { key: "category_id", label: "Category ID" },
    { key: "is_featured", label: "Featured product", type: "checkbox" },
  ],
  categories: [
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "URL slug", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "retail_markup_percentage", label: "Retail Markup (%)", type: "number", required: false },
  ],
  product_variants: [
    { key: "product_id", label: "Product ID", required: true },
    { key: "sku", label: "SKU", required: true },
    { key: "size", label: "Size" },
    { key: "color", label: "Color" },
    { key: "inventory_quantity", label: "Stock quantity", type: "number", required: true },
  ],
  product_images: [
    { key: "product_id", label: "Product ID", required: true },
    { key: "image_url", label: "Image URL (HTTPS)", type: "url", required: true },
    { key: "display_order", label: "Display order", type: "number", required: true },
  ],
};

const titles: Record<Table, string> = {
  products: "Products",
  categories: "Categories",
  product_variants: "Sizes & Stock",
  product_images: "Product Images",
};

function AdminPage() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const role = useAdmin();
  const [tab, setTab] = useState<"dashboard" | "brand" | "orders" | Table>("dashboard");

  useEffect(() => {
    if (!isLoading && (!user || (role.isSuccess && !role.data))) {
      void navigate({ to: "/account", replace: true });
    }
  }, [user, isLoading, role.isSuccess, role.data, navigate]);

  if (isLoading || (user && role.isPending)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-emerald-600" />
      </div>
    );
  }

  if (!user || !role.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">STYVEX</h1>
          <p className="mt-2 text-muted-foreground">Unable to verify access.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Box },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "product_variants", label: "Variants", icon: BarChart3 },
    { id: "product_images", label: "Images", icon: ImageIcon },
    { id: "brand", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-foreground flex flex-col md:flex-row">
      <aside className="md:w-[280px] shrink-0 border-r border-border/50 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col z-10 sticky top-0 md:h-screen">
        <div className="p-6 md:p-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-emerald-950">STYVEX</h1>
            <p className="text-xs font-semibold text-emerald-600/70 uppercase tracking-widest mt-1">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 md:px-6 py-4 space-y-1.5 overflow-y-auto hidden md:block">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all",
                tab === item.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Mobile Nav */}
        <nav className="flex px-4 py-2 space-x-2 overflow-x-auto md:hidden border-b border-border/50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "whitespace-nowrap flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0",
                tab === item.id
                  ? "bg-emerald-600 text-white"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-border/50 hidden md:block">
          <p className="text-xs font-semibold text-muted-foreground truncate mb-4">{user?.email}</p>
          <div className="grid grid-cols-2 gap-2">
            <a href="/" className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl border border-border/60 hover:bg-muted transition">
              Store
            </a>
            <button onClick={signOut} className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          {tab === "dashboard" ? (
            <DashboardOverview setTab={setTab} />
          ) : tab === "brand" ? (
            <BrandSettings />
          ) : tab === "orders" ? (
            <OrdersAdmin />
          ) : (
            <CatalogEditor key={tab} table={tab as Table} />
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardOverview({ setTab }: { setTab: (t: any) => void }) {
  // We can fetch counts here if we wanted to
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h2 className="font-display text-4xl font-bold tracking-tight text-emerald-950">Welcome back</h2>
        <p className="text-muted-foreground mt-2 text-lg">Here's what's happening with your store today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-[2rem] bg-emerald-600 p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden group cursor-pointer" onClick={() => setTab("orders")}>
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition duration-500">
            <ShoppingCart className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 font-semibold uppercase tracking-wider text-sm mb-2">Total Orders</p>
            <p className="font-display text-5xl font-bold">---</p>
            <p className="mt-4 text-emerald-100 text-sm font-medium">Manage pending fulfillments &rarr;</p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 border border-border/50 shadow-sm relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition" onClick={() => setTab("products")}>
          <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-600 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition duration-500">
            <Box className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-muted-foreground font-semibold uppercase tracking-wider text-sm mb-2">Products</p>
            <p className="font-display text-5xl font-bold text-emerald-950">---</p>
            <p className="mt-4 text-emerald-600 text-sm font-bold">View catalog &rarr;</p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 border border-border/50 shadow-sm relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition" onClick={() => setTab("categories")}>
          <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-600 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition duration-500">
            <Tag className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-muted-foreground font-semibold uppercase tracking-wider text-sm mb-2">Categories</p>
            <p className="font-display text-5xl font-bold text-emerald-950">---</p>
            <p className="mt-4 text-emerald-600 text-sm font-bold">Edit pricing markup &rarr;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandSettings() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["brand-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
  const [busy, setBusy] = useState(false);

  if (query.isPending) return <p className="text-muted-foreground">Loading brand settings…</p>;
  if (query.isError) return <button className={buttonOutline} onClick={() => query.refetch()}>Retry loading</button>;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h2 className="font-display text-4xl font-bold tracking-tight text-emerald-950">Brand Settings</h2>
        <p className="text-muted-foreground mt-2 text-lg">Customize the look and feel of the storefront.</p>
      </header>

      <form
        className="rounded-[2rem] border border-border/50 bg-white p-8 md:p-12 shadow-sm"
        key={JSON.stringify(query.data)}
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setBusy(true);
          try {
            const { data: saved, error } = await supabase
              .from("store_settings")
              .update({
                header_logo: String(data.get("header_logo")),
                footer_logo: String(data.get("footer_logo")),
                header_height: Number(data.get("header_height")),
                footer_height: Number(data.get("footer_height")),
              })
              .eq("id", 1)
              .select("id");
            if (error) throw error;
            if (!saved?.length) throw new Error("No changes saved.");
            await client.invalidateQueries({ queryKey: ["brand-settings"] });
            toast.success("Brand settings saved");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-12 md:grid-cols-2">
          {(["header", "footer"] as const).map((place) => (
            <fieldset key={place} className="space-y-6">
              <div>
                <legend className="text-xl font-bold capitalize text-emerald-950">{place} configuration</legend>
                <p className="text-sm text-muted-foreground mt-1">Select the logo variant and size.</p>
              </div>
              <div
                className={cn(
                  "flex h-40 items-center justify-center rounded-3xl border border-border/50 p-5 shadow-inner",
                  place === "footer" ? "bg-emerald-950" : "bg-[#f4f7f6]"
                )}
              >
                <img
                  src={query.data[`${place}_logo`]}
                  alt={`${place} saved logo`}
                  style={{ height: query.data[`${place}_height`] }}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-foreground">
                  Logo variant
                  <select
                    className={cn(input, "mt-2")}
                    name={`${place}_logo`}
                    defaultValue={query.data[`${place}_logo`]}
                  >
                    {logos.map((logo) => (
                      <option key={logo} value={`/${logo}.svg`}>
                        {logo.replace("styvex-", "").replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold text-foreground">
                  Height (px)
                  <input
                    className={cn(input, "mt-2")}
                    name={`${place}_height`}
                    type="number"
                    min="24"
                    max={place === "header" ? 48 : 80}
                    required
                    defaultValue={query.data[`${place}_height`]}
                  />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 flex justify-end">
          <button disabled={busy} className={button}>
            {busy ? "Saving…" : "Save all changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function CatalogEditor({ table }: { table: Table }) {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  
  const query = useQuery({
    queryKey: ["admin-catalog", table, page, search],
    queryFn: async () => {
      let request = supabase
        .from(table)
        .select("*", { count: "exact" })
        .order("id")
        .range(page * 20, page * 20 + 19);
      if (search.trim()) {
        if (table === "products" || table === "categories")
          request = request.ilike("name", `%${search.trim()}%`);
        else request = request.filter("product_id", "eq", search.trim());
      }
      const { data, error, count } = await request;
      if (error) throw error;
      return { rows: data as unknown as Record<string, unknown>[], count: count ?? 0 };
    },
  });

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!draft ? (
        <>
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight text-emerald-950">{titles[table]}</h2>
              <p className="text-muted-foreground mt-2 text-lg">Manage your store's data.</p>
            </div>
            <button className={button} onClick={() => setDraft({})}>
              <Plus className="w-5 h-5 mr-2" />
              Add new {table === "categories" ? "category" : "record"}
            </button>
          </header>
          
          <div className="rounded-[2rem] border border-border/50 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border/50 bg-emerald-50/50">
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
                    aria-label="Search records"
                    placeholder={table === "products" || table === "categories" ? "Search by name..." : "Search product ID..."}
                  />
                </div>
                <button className={buttonSecondary}>Search</button>
              </form>
            </div>
            
            {query.isPending ? (
              <div className="p-12 text-center text-muted-foreground">Loading…</div>
            ) : query.isError ? (
              <div className="p-12 text-center text-red-500 font-semibold">Unable to load records.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f4f7f6]">
                      <tr>
                        <th className="p-6 font-bold text-emerald-950">Record</th>
                        <th className="p-6 font-bold text-emerald-950">Details</th>
                        <th className="p-6 font-bold text-emerald-950 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {query.data.rows.map((row) => (
                        <tr className="hover:bg-emerald-50/30 transition group" key={String(row["id"])}>
                          <td className="p-6 max-w-xs">
                            <p className="font-bold text-foreground break-words text-base">
                              {String(row["name"] ?? row["sku"] ?? "Product Image")}
                            </p>
                            <code className="mt-1.5 block text-xs font-medium text-muted-foreground px-2 py-1 bg-muted/50 rounded-lg inline-block select-all">
                              {String(row["id"])}
                            </code>
                          </td>
                          <td className="p-6 font-medium text-muted-foreground">
                            {table === "products"
                              ? `$${Number(row["price"]).toFixed(2)}`
                              : table === "categories"
                              ? `Markup: ${row["retail_markup_percentage"] ?? 0}%`
                              : table === "product_variants"
                                ? `${row["size"] ?? "No size"} / ${row["color"] ?? "No color"} · Stock: ${row["inventory_quantity"]}`
                                : String(row["slug"] ?? row["image_url"] ?? "")}
                          </td>
                          <td className="p-6 text-right">
                            <button className="text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-4" onClick={() => setDraft(row)}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!query.data.rows.length && <div className="p-12 text-center text-muted-foreground font-semibold">No records found.</div>}
                </div>
                <div className="p-6 border-t border-border/50 bg-[#f4f7f6] flex items-center justify-between">
                  <button className={buttonOutline} disabled={page === 0} onClick={() => setPage(page - 1)}>
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
        </>
      ) : (
        <div className="max-w-2xl mx-auto">
          <button className="flex items-center text-muted-foreground hover:text-emerald-700 font-bold mb-8 transition" onClick={() => setDraft(null)}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to list
          </button>
          <div className="rounded-[2rem] border border-border/50 bg-white p-8 md:p-12 shadow-sm">
            <h3 className="mb-8 font-display text-3xl font-bold text-emerald-950">{draft["id"] ? "Edit Record" : "Create New Record"}</h3>
            <form
              key={String(draft["id"] ?? "new")}
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const payload: Record<string, unknown> = {};
                for (const field of fields[table]) {
                  const value = form.get(field.key);
                  payload[field.key] =
                    field.type === "checkbox"
                      ? value === "on"
                      : field.type === "number"
                        ? Number(value)
                        : String(value ?? "").trim() || null;
                }
                if (payload["image_url"] && !String(payload["image_url"]).startsWith("https://")) {
                  toast.error("Use an HTTPS image URL");
                  return;
                }
                setBusy(true);
                try {
                  const request = draft["id"]
                    ? supabase
                        .from(table)
                        .update(payload as never)
                        .eq("id", String(draft["id"]))
                    : supabase.from(table).insert(payload as never);
                  const { data, error } = await request.select("id");
                  if (error) throw error;
                  if (!data?.length) throw new Error("No changes saved.");
                  setDraft(null);
                  await client.invalidateQueries();
                  toast.success("Record saved successfully");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Save failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="grid gap-6">
                {fields[table].map((field) => (
                  <label key={field.key} className="block text-sm font-bold text-foreground">
                    {field.label}
                    {field.type === "textarea" ? (
                      <textarea
                        className={cn(input, "mt-2 min-h-[120px]")}
                        name={field.key}
                        defaultValue={String(draft[field.key] ?? "")}
                      />
                    ) : field.type === "checkbox" ? (
                      <input
                        className="ml-3 accent-emerald-600 w-5 h-5"
                        name={field.key}
                        type="checkbox"
                        defaultChecked={!!draft[field.key]}
                      />
                    ) : (
                      <input
                        className={cn(input, "mt-2")}
                        name={field.key}
                        type={field.type ?? "text"}
                        required={field.required}
                        min={field.type === "number" ? 0 : undefined}
                        step={
                          field.key === "price" ? "0.01" : field.type === "number" ? 1 : undefined
                        }
                        defaultValue={String(draft[field.key] ?? (field.type === "number" ? 0 : ""))}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-border/50 flex flex-row-reverse gap-4">
                <button className={button} disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button type="button" className={buttonOutline} disabled={busy} onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function OrdersAdmin() {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * 20, page * 20 + 19);

      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const updateStatus = async (orderId: string, status: string) => {
    setBusyId(orderId);
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (query.isPending) return <p className="text-muted-foreground p-8">Loading orders…</p>;
  if (query.isError) return <button className={buttonOutline} onClick={() => query.refetch()}>Retry loading orders</button>;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h2 className="font-display text-4xl font-bold tracking-tight text-emerald-950">Orders</h2>
        <p className="text-muted-foreground mt-2 text-lg">Manage and fulfill customer orders.</p>
      </header>

      <div className="rounded-[2rem] border border-border/50 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f4f7f6]">
              <tr>
                <th className="p-6 font-bold text-emerald-950">Order Info</th>
                <th className="p-6 font-bold text-emerald-950">Items</th>
                <th className="p-6 font-bold text-emerald-950">Amount</th>
                <th className="p-6 font-bold text-emerald-950">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {query.data.rows?.map((order: any) => (
                <tr key={order.id} className="align-top hover:bg-emerald-50/30 transition">
                  <td className="p-6">
                    <p className="font-bold text-emerald-950 text-base">{new Date(order.created_at).toLocaleString()}</p>
                    <code className="mt-2 block text-xs font-medium text-muted-foreground px-2 py-1 bg-muted/50 rounded-lg inline-block select-all">{order.id}</code>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">User: <span className="text-foreground">{order.user_id}</span></p>
                  </td>
                  <td className="p-6">
                    <ul className="list-inside list-disc space-y-1.5 text-xs font-medium text-muted-foreground">
                      {order.order_items?.map((item: any) => (
                        <li key={item.id}>
                          <span className="font-bold text-emerald-950">{item.quantity}x</span> {item.product_name} (${item.price})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-6 font-bold text-emerald-950 text-base">
                    ${Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="p-6">
                    <select
                      className={cn(input, "py-2.5")}
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!query.data.rows?.length && <div className="p-12 text-center text-muted-foreground font-semibold">No orders found.</div>}
        </div>
        
        <div className="p-6 border-t border-border/50 bg-[#f4f7f6] flex items-center justify-between">
          <button className={buttonOutline} disabled={page === 0} onClick={() => setPage(page - 1)}>
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
      </div>
    </section>
  );
}

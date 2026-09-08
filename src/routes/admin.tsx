import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({ component: AdminPage });
const input = "w-full rounded-lg border border-gray-300 bg-white p-3 text-sm";
const button =
  "rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40";
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
  product_variants: "Sizes, colors & stock",
  product_images: "Product images",
};

function AdminPage() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const role = useAdmin();
  const [tab, setTab] = useState<"brand" | "orders" | Table>("brand");
  useEffect(() => {
    if (!isLoading && (!user || (role.isSuccess && !role.data))) {
      void navigate({ to: "/account", replace: true });
    }
  }, [user, isLoading, role.isSuccess, role.data, navigate]);
  let message = "";
  if (isLoading || (user && role.isPending)) message = "Checking access…";
  else if (!user) message = "Opening your account…";
  else if (role.isError) message = "Unable to verify access. Please try again.";
  else if (!role.data) message = "Opening your account…";
  if (message)
    return (
      <main className="mx-auto max-w-xl p-8 pt-24">
        <h1 className="mb-4 text-2xl font-bold">STYVEX</h1>
        <p role="status">{message}</p>
        <a href="/account" className="mt-6 inline-block underline">
          Go to account
        </a>
        {role.isError && (
          <button className={button} onClick={() => role.refetch()}>
            Retry
          </button>
        )}
      </main>
    );
  return (
    <div className="min-h-screen bg-gray-50 text-neutral-900">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">STYVEX Admin</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="flex gap-5 text-sm">
            <a href="/" className="underline">
              View store
            </a>
            <button onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Administration sections">
          {(["brand", "orders", ...Object.keys(titles)] as Array<"brand" | "orders" | Table>).map((t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              className={tab === t ? button : "rounded-lg border bg-white px-4 py-2.5 text-sm"}
              onClick={() => setTab(t)}
            >
              {t === "brand" ? "Brand settings" : t === "orders" ? "Orders" : titles[t as Table]}
            </button>
          ))}
        </nav>
        {tab === "brand" ? <BrandSettings /> : tab === "orders" ? <OrdersAdmin /> : <CatalogEditor key={tab} table={tab as Table} />}
      </main>
    </div>
  );
}

function BrandSettings() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["brand-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const [busy, setBusy] = useState(false);
  if (query.isPending) return <p>Loading brand settings…</p>;
  if (query.isError)
    return <button onClick={() => query.refetch()}>Could not load settings. Retry</button>;
  return (
    <section className="rounded-xl border bg-white p-6">
      <h2 className="text-xl font-semibold">Brand settings</h2>
      <p className="mb-6 mt-2 text-sm text-gray-500">
        Choose a logo color variant and display size. Saved changes appear throughout the store.
      </p>
      <form
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
            if (!saved?.length) throw new Error("No changes saved. Check administrator access.");
            await client.invalidateQueries({ queryKey: ["brand-settings"] });
            toast.success("Brand settings saved");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-8 md:grid-cols-2">
          {(["header", "footer"] as const).map((place) => (
            <fieldset key={place} className="space-y-4">
              <legend className="mb-3 font-semibold capitalize">{place}</legend>
              <div
                className={`flex min-h-28 items-center justify-center rounded-lg p-5 ${place === "footer" ? "bg-neutral-900" : "bg-gray-50"}`}
              >
                <img
                  src={query.data[`${place}_logo`]}
                  alt={`${place} saved logo`}
                  style={{ height: query.data[`${place}_height`] }}
                />
              </div>
              <label className="block text-sm">
                Logo variant
                <select
                  className={input}
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
              <label className="block text-sm">
                Height in pixels
                <input
                  className={input}
                  name={`${place}_height`}
                  type="number"
                  min="24"
                  max={place === "header" ? 48 : 80}
                  required
                  defaultValue={query.data[`${place}_height`]}
                />
              </label>
            </fieldset>
          ))}
        </div>
        <button disabled={busy} className={`${button} mt-6`}>
          {busy ? "Saving…" : "Save brand settings"}
        </button>
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
    <section>
      <div className="mb-5 flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{titles[table]}</h2>
          <p className="text-sm text-gray-500">
            Manage live catalog records. Copy a product ID to find its images or variants.
          </p>
        </div>
        <button className={button} onClick={() => setDraft({})}>
          Add {table === "categories" ? "category" : "record"}
        </button>
      </div>
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(String(new FormData(e.currentTarget).get("search") ?? ""));
          setPage(0);
        }}
      >
        <input
          className={input}
          name="search"
          aria-label="Search records"
          placeholder={
            table === "products" || table === "categories"
              ? "Search by name"
              : "Filter by exact product ID"
          }
        />
        <button className={button}>Search</button>
      </form>
      {query.isPending ? (
        <p>Loading…</p>
      ) : query.isError ? (
        <div role="alert">
          Unable to load records.{" "}
          <button onClick={() => query.refetch()} className="underline">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">Record</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.rows.map((row) => (
                  <tr className="border-t" key={String(row["id"])}>
                    <td className="max-w-xs p-4">
                      <p className="font-medium break-words">
                        {String(row["name"] ?? row["sku"] ?? "Product image")}
                      </p>
                      <code className="block text-xs text-gray-500 select-all">
                        {String(row["id"])}
                      </code>
                    </td>
                    <td className="p-4">
                      {table === "products"
                        ? `$${Number(row["price"]).toFixed(2)}`
                        : table === "product_variants"
                          ? `${row["size"] ?? ""} / ${row["color"] ?? ""} · Stock: ${row["inventory_quantity"]}`
                          : String(row["slug"] ?? row["image_url"] ?? "")}
                    </td>
                    <td className="p-4">
                      <button className="underline" onClick={() => setDraft(row)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!query.data.rows.length && <p className="p-6">No records found.</p>}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <p className="text-sm">
              Page {page + 1} · {query.data.count} records
            </p>
            <button
              className={button}
              disabled={(page + 1) * 20 >= query.data.count}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      {draft && (
        <div className="mt-8 rounded-xl border bg-white p-6">
          <h3 className="mb-5 text-lg font-semibold">{draft["id"] ? "Edit" : "Add"} record</h3>
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
                if (!data?.length) throw new Error("No changes saved. Check administrator access.");
                setDraft(null);
                await client.invalidateQueries();
                toast.success("Record saved");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Save failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {fields[table].map((field) => (
                <label key={field.key} className="block text-sm">
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea
                      className={input}
                      name={field.key}
                      defaultValue={String(draft[field.key] ?? "")}
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      className="ml-3"
                      name={field.key}
                      type="checkbox"
                      defaultChecked={!!draft[field.key]}
                    />
                  ) : (
                    <input
                      className={input}
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
            <div className="mt-6 flex gap-4">
              <button className={button} disabled={busy}>
                {busy ? "Saving…" : "Save record"}
              </button>
              <button type="button" disabled={busy} onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </form>
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

  if (query.isPending) return <p>Loading orders…</p>;
  if (query.isError) return <button onClick={() => query.refetch()}>Retry loading orders</button>;

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Orders</h2>
        <p className="text-sm text-gray-500">Manage and fulfill customer orders.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Order Info</th>
              <th className="p-4">Items</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {query.data.rows?.map((order: any) => (
              <tr key={order.id} className="align-top">
                <td className="p-4">
                  <p className="font-medium text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                  <code className="mt-1 block text-xs text-gray-500">{order.id}</code>
                  <p className="mt-2 text-xs">User: {order.user_id}</p>
                </td>
                <td className="p-4">
                  <ul className="list-inside list-disc space-y-1 text-xs text-gray-600">
                    {order.order_items?.map((item: any) => (
                      <li key={item.id}>
                        {item.quantity}x {item.product_name} (${item.price})
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 font-medium">
                  ${Number(order.total_amount).toFixed(2)}
                </td>
                <td className="p-4">
                  <select
                    className={input}
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
        {!query.data.rows?.length && <p className="p-6">No orders found.</p>}
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <p className="text-sm">
          Page {page + 1} · {query.data.count} records
        </p>
        <button
          className={button}
          disabled={(page + 1) * 20 >= query.data.count}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

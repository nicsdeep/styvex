require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const PRINTFUL_API = "https://api.printful.com";
const token = process.env.PRINTFUL_TOKEN;
const storeId = process.env.PRINTFUL_STORE_ID;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !serviceRoleKey) {
  console.error("Missing PRINTFUL_TOKEN, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function printful(path) {
  const headers = { Authorization: `Bearer ${token}` };
  if (storeId) headers["X-PF-Store-Id"] = storeId;

  const response = await fetch(`${PRINTFUL_API}${path}`, { headers });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Printful request failed (${response.status})`);
  }
  return payload;
}

async function getAllSyncProducts() {
  const products = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const payload = await printful(`/store/products?status=synced&limit=${limit}&offset=${offset}`);
    products.push(...payload.result);
    if (products.length >= payload.paging.total) return products;
    offset += limit;
  }
}

async function ensureCategory() {
  const { data, error } = await supabase
    .from("categories")
    .upsert(
      { name: "Printful", slug: "printful", description: "Made-to-order products fulfilled by Printful." },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function syncProduct(summary, categoryId) {
  const { result } = await printful(`/store/products/${summary.id}`);
  const syncProduct = result.sync_product;
  const syncVariants = result.sync_variants.filter((variant) => variant.synced);
  if (!syncVariants.length) return false;

  const baseSlug = slugify(syncProduct.name) || `printful-${syncProduct.id}`;
  const retailPrices = syncVariants
    .map((variant) => Number(variant.retail_price))
    .filter(Number.isFinite);
  const price = retailPrices.length ? Math.min(...retailPrices) : 0;

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        category_id: categoryId,
        name: syncProduct.name,
        slug: `${baseSlug}-${syncProduct.id}`,
        description: `Made to order and fulfilled by Printful. Available options are shown on this page.`,
        price,
        supplier: "printful",
        supplier_product_id: String(syncProduct.id),
      },
      { onConflict: "supplier,supplier_product_id" }
    )
    .select("id")
    .single();
  if (productError) throw productError;

  const variants = syncVariants.map((variant) => ({
    product_id: product.id,
    sku: variant.sku || `PF-${variant.id}`,
    size: variant.size || null,
    color: variant.color || null,
    inventory_quantity: variant.availability_status === "out_of_stock" ? 0 : 100,
    supplier_variant_id: String(variant.id),
  }));

  const { error: variantsError } = await supabase
    .from("product_variants")
    .upsert(variants, { onConflict: "supplier_variant_id" });
  if (variantsError) throw variantsError;

  const imageUrls = [
    syncProduct.thumbnail_url,
    ...syncVariants.map((variant) => variant.product?.image),
    ...syncVariants.flatMap((variant) => (variant.files || []).map((file) => file.preview_url)),
  ].filter(Boolean);
  const uniqueImages = [...new Set(imageUrls)];

  await supabase.from("product_images").delete().eq("product_id", product.id);
  if (uniqueImages.length) {
    const { error: imagesError } = await supabase.from("product_images").insert(
      uniqueImages.map((imageUrl, displayOrder) => ({
        product_id: product.id,
        image_url: imageUrl,
        display_order: displayOrder,
      }))
    );
    if (imagesError) throw imagesError;
  }

  return true;
}

async function main() {
  const categoryId = await ensureCategory();
  const products = await getAllSyncProducts();
  let synced = 0;

  for (const product of products) {
    if (await syncProduct(product, categoryId)) synced += 1;
  }

  console.log(`Synced ${synced} Printful product${synced === 1 ? "" : "s"}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});


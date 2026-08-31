import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars (adjust path if your .env is elsewhere)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
  const templatePath = path.resolve(__dirname, "products-template.json");
  if (!fs.existsSync(templatePath)) {
    console.error("Could not find products-template.json");
    process.exit(1);
  }

  const rawData = fs.readFileSync(templatePath, "utf-8");
  const data = JSON.parse(rawData);

  console.log("Starting import...");

  // 1. Insert Categories
  for (const cat of data.categories) {
    const { error } = await supabase
      .from("categories")
      .upsert({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
      }, { onConflict: "slug" });

    if (error) {
      console.error(`Error inserting category ${cat.slug}:`, error.message);
    } else {
      console.log(`✓ Category: ${cat.name}`);
    }
  }

  // Fetch categories to map slug to ID
  const { data: categoriesData } = await supabase.from("categories").select("id, slug");
  const categoryMap = new Map(categoriesData?.map(c => [c.slug, c.id]));

  // 2. Insert Products
  for (const prod of data.products) {
    const category_id = categoryMap.get(prod.category_slug);

    if (!category_id) {
      console.error(`Unknown category slug: ${prod.category_slug} for product ${prod.slug}`);
      continue;
    }

    const { data: productData, error: productError } = await supabase
      .from("products")
      .upsert({
        slug: prod.slug,
        name: prod.name,
        description: prod.description,
        price: prod.price,
        category_id: category_id,
        is_featured: prod.is_featured || false,
      }, { onConflict: "slug" })
      .select("id")
      .single();

    if (productError || !productData) {
      console.error(`Error inserting product ${prod.slug}:`, productError?.message);
      continue;
    }

    const productId = productData.id;
    console.log(`✓ Product: ${prod.name}`);

    // Insert Images
    if (prod.images) {
      for (const img of prod.images) {
        const { error: imgError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: img.image_url,
            display_order: img.display_order,
          });
        
        if (imgError) console.error(`  - Error inserting image for ${prod.slug}:`, imgError.message);
      }
    }

    // Insert Variants
    if (prod.variants) {
      for (const variant of prod.variants) {
        const { error: variantError } = await supabase
          .from("product_variants")
          .upsert({
            product_id: productId,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            inventory_quantity: variant.inventory_quantity,
          }, { onConflict: "sku" });

        if (variantError) console.error(`  - Error inserting variant ${variant.sku}:`, variantError.message);
      }
    }
  }

  console.log("Import complete!");
}

importData().catch(console.error);

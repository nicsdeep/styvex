import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

const env = config({ path: ".env" });

const supabaseUrl = env.VITE_SUPABASE_URL || Deno.env.get("VITE_SUPABASE_URL");
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching external products from FakeStoreAPI...");
  const response = await fetch("https://fakestoreapi.com/products");
  const products = await response.json();

  // Filter only fashion/lifestyle items
  const targetCategories = ["women's clothing", "jewelery"];
  const filteredProducts = products.filter(p => targetCategories.includes(p.category));

  console.log(`Found ${filteredProducts.length} suitable products. Inserting to Supabase...`);

  for (const item of filteredProducts) {
    // 1. Ensure category exists
    const categoryName = item.category === "women's clothing" ? "Women's Clothing" : "Jewelry";
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: categoryData, error: catError } = await supabase
      .from("categories")
      .upsert({ name: categoryName, slug: categorySlug }, { onConflict: "slug" })
      .select()
      .single();

    if (catError) {
      console.error(`Error upserting category ${categoryName}:`, catError.message);
      continue;
    }

    const categoryId = categoryData.id;

    // 2. Insert product
    const productSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${item.id}`;
    
    const { data: productData, error: prodError } = await supabase
      .from("products")
      .upsert({
        name: item.title,
        slug: productSlug,
        description: item.description,
        price: item.price,
        category_id: categoryId,
        is_featured: item.rating.rate > 4.0,
      }, { onConflict: "slug" })
      .select()
      .single();

    if (prodError) {
      console.error(`Error upserting product ${item.title}:`, prodError.message);
      continue;
    }

    const productId = productData.id;

    // 3. Insert Image
    await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);

    await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: item.image,
        display_order: 1,
      });

    // 4. Insert Variants (Generate mock variants for clothing, none for jewelry)
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);

    if (item.category === "women's clothing") {
      const sizes = ["S", "M", "L"];
      const colors = ["Black", "White"];
      
      for (const color of colors) {
        for (const size of sizes) {
          await supabase.from("product_variants").insert({
            product_id: productId,
            sku: `${productSlug}-${color.charAt(0)}${size}`.toUpperCase(),
            color: color,
            size: size,
            inventory_quantity: Math.floor(Math.random() * 20) + 1,
          });
        }
      }
    } else {
      // Jewelry gets a single default variant
      await supabase.from("product_variants").insert({
        product_id: productId,
        sku: `${productSlug}-DEFAULT`.toUpperCase(),
        inventory_quantity: Math.floor(Math.random() * 50) + 10,
      });
    }

    console.log(`Inserted: ${item.title}`);
  }

  console.log("Done seeding products!");
}

run().catch(console.error);

const https = require("https");
const fs = require("fs");
const path = require("path");

function readEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
    }
  });
  return env;
}

const env = readEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function supabaseRequest(method, table, data = null, query = "") {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}${query}`);
    const options = {
      method,
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      }
    };
    
    if (method === "POST" && data && !Array.isArray(data)) {
      options.headers["Prefer"] = "resolution=merge-duplicates,return=representation";
    }

    const req = https.request(url, options, (res) => {
      let responseData = "";
      res.on("data", chunk => responseData += chunk);
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Supabase API error (${res.statusCode}): ${responseData}`));
        } else {
          try {
            resolve(responseData ? JSON.parse(responseData) : null);
          } catch (e) {
            resolve(null);
          }
        }
      });
    });
    
    req.on("error", reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log("Fetching external products from FakeStoreAPI...");
  const products = await fetchJson("https://fakestoreapi.com/products");

  const targetCategories = ["women's clothing", "jewelery"];
  const filteredProducts = products.filter(p => targetCategories.includes(p.category));

  console.log(`Found ${filteredProducts.length} suitable products. Inserting to Supabase...`);

  for (const item of filteredProducts) {
    const categoryName = item.category === "women's clothing" ? "Women's Clothing" : "Jewelry";
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let categories = await supabaseRequest("GET", "categories", null, `?slug=eq.${categorySlug}`);
    let categoryId;
    
    if (!categories || categories.length === 0) {
      const inserted = await supabaseRequest("POST", "categories", [{ name: categoryName, slug: categorySlug }]);
      categoryId = inserted[0].id;
    } else {
      categoryId = categories[0].id;
    }

    const productSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${item.id}`;
    
    let existingProducts = await supabaseRequest("GET", "products", null, `?slug=eq.${productSlug}`);
    let productId;
    
    if (!existingProducts || existingProducts.length === 0) {
      const insertedProd = await supabaseRequest("POST", "products", [{
        name: item.title,
        slug: productSlug,
        description: item.description,
        price: item.price,
        category_id: categoryId,
        is_featured: item.rating.rate > 4.0
      }]);
      productId = insertedProd[0].id;
    } else {
      productId = existingProducts[0].id;
    }

    await supabaseRequest("DELETE", "product_images", null, `?product_id=eq.${productId}`);
    await supabaseRequest("POST", "product_images", [{
      product_id: productId,
      image_url: item.image,
      display_order: 1
    }]);

    await supabaseRequest("DELETE", "product_variants", null, `?product_id=eq.${productId}`);
    
    const variantsToInsert = [];
    if (item.category === "women's clothing") {
      const sizes = ["S", "M", "L"];
      const colors = ["Black", "White"];
      for (const color of colors) {
        for (const size of sizes) {
          variantsToInsert.push({
            product_id: productId,
            sku: `${productSlug}-${color.charAt(0)}${size}`.toUpperCase().substring(0, 50),
            color: color,
            size: size,
            inventory_quantity: Math.floor(Math.random() * 20) + 1
          });
        }
      }
    } else {
      variantsToInsert.push({
        product_id: productId,
        sku: `${productSlug}-DEFAULT`.toUpperCase().substring(0, 50),
        inventory_quantity: Math.floor(Math.random() * 50) + 10
      });
    }
    
    await supabaseRequest("POST", "product_variants", variantsToInsert);
    console.log(`Inserted: ${item.title}`);
  }

  console.log("Done seeding products!");
}

run().catch(console.error);

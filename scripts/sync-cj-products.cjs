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
const cjApiKey = env.CJDROPSHIPPING_API_KEY;

if (!supabaseUrl || !supabaseKey || !cjApiKey) {
  console.error("Missing Supabase or CJ Dropshipping credentials in .env");
  process.exit(1);
}

function cjPost(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };
    const req = https.request(url, options, res => {
      let responseData = "";
      res.on("data", chunk => responseData += chunk);
      res.on("end", () => resolve(JSON.parse(responseData)));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function cjGet(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      headers: { "CJ-Access-Token": token }
    };
    const req = https.request(url, options, res => {
      let responseData = "";
      res.on("data", chunk => responseData += chunk);
      res.on("end", () => resolve(JSON.parse(responseData)));
    });
    req.on("error", reject);
    req.end();
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
  console.log("Authenticating with CJ Dropshipping...");
  const authRes = await cjPost("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", { apiKey: cjApiKey });
  
  if (!authRes.data || !authRes.data.accessToken) {
    throw new Error("Failed to authenticate with CJ Dropshipping API");
  }
  
  const token = authRes.data.accessToken;
  console.log("Authenticated! Fetching products...");

  // Fetch 10 Women's Clothing and 10 Jewelry items
  const categoriesToFetch = [
    { id: '2FE8A083-5E7B-4179-896D-561EA116F730', name: "Women's Clothing" },
    { id: '2837816E-2FEA-4455-845C-6F40C6D70D1E', name: "Jewelry" }
  ];

  for (const cat of categoriesToFetch) {
    console.log(`\nFetching ${cat.name}...`);
    const url = `https://developers.cjdropshipping.com/api2.0/v1/product/listV2?page=1&size=10&categoryId=${cat.id}`;
    const prodRes = await cjGet(url, token);
    
    if (!prodRes.data || !prodRes.data.content || prodRes.data.content.length === 0) {
      console.log(`No products found for ${cat.name}`);
      continue;
    }

    const productsList = prodRes.data.content[0].productList;
    console.log(`Found ${productsList.length} products. Inserting to Supabase...`);

    // Ensure category exists
    const categorySlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let categories = await supabaseRequest("GET", "categories", null, `?slug=eq.${categorySlug}`);
    let categoryId;
    if (!categories || categories.length === 0) {
      const inserted = await supabaseRequest("POST", "categories", [{ name: cat.name, slug: categorySlug }]);
      categoryId = inserted[0].id;
    } else {
      categoryId = categories[0].id;
    }

    for (const item of productsList) {
      const productSlug = item.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50) + `-${item.id}`;
      
      let existingProducts = await supabaseRequest("GET", "products", null, `?slug=eq.${productSlug}`);
      let productId;
      
      if (!existingProducts || existingProducts.length === 0) {
        const insertedProd = await supabaseRequest("POST", "products", [{
          name: item.nameEn,
          slug: productSlug,
          description: `Imported from CJ Dropshipping. SKU: ${item.sku}`,
          price: parseFloat(item.sellPrice) * 1.5, // 50% markup
          category_id: categoryId,
          is_featured: true
        }]);
        productId = insertedProd[0].id;
      } else {
        productId = existingProducts[0].id;
      }

      // Sync Image
      await supabaseRequest("DELETE", "product_images", null, `?product_id=eq.${productId}`);
      await supabaseRequest("POST", "product_images", [{
        product_id: productId,
        image_url: item.bigImage,
        display_order: 1
      }]);

      // Sync Variants (mocking variants for simplicity as listV2 doesn't return full variant matrix)
      await supabaseRequest("DELETE", "product_variants", null, `?product_id=eq.${productId}`);
      
      const variantsToInsert = [];
      if (cat.name === "Women's Clothing") {
        const sizes = ["S", "M", "L"];
        for (const size of sizes) {
          variantsToInsert.push({
            product_id: productId,
            sku: `${item.sku}-${size}`.substring(0, 50),
            size: size,
            inventory_quantity: item.warehouseInventoryNum || 100
          });
        }
      } else {
        variantsToInsert.push({
          product_id: productId,
          sku: `${item.sku}-DEFAULT`.substring(0, 50),
          inventory_quantity: item.warehouseInventoryNum || 100
        });
      }
      
      await supabaseRequest("POST", "product_variants", variantsToInsert);
      console.log(`Inserted: ${item.nameEn}`);
    }
  }

  console.log("\nDone syncing CJ Dropshipping products!");
}

run().catch(console.error);

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id, 
      name, 
      slug,
      products(
        product_images(image_url)
      )
    `)
    .order("name")
    .limit(1, { foreignTable: "products" })
    .limit(1, { foreignTable: "products.product_images" });

  console.log(JSON.stringify(data, null, 2));
}

run();

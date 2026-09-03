require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function cleanCJ() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  
  const { data: products, error } = await supabase.from('products').select('id, description').ilike('description', '%CJ%');
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${products.length} products to clean`);
  
  for (const product of products) {
    if (product.description) {
      let newDesc = product.description.replace(/Imported from CJ Dropshipping\. SKU: CJ[A-Z0-9]+/g, 'Product SKU: STX' + product.id.substring(0, 6).toUpperCase());
      newDesc = newDesc.replace(/Imported from CJ Dropshipping\./g, '');
      newDesc = newDesc.replace(/CJ/g, 'STX');
      
      const { error: updateError } = await supabase.from('products').update({ description: newDesc }).eq('id', product.id);
      if (updateError) {
        console.error(`Error updating ${product.id}:`, updateError);
      }
    }
  }
  
  console.log("Finished cleaning descriptions!");
}

cleanCJ();

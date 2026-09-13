const fs = require('fs');
const https = require('https');
const path = require('path');
const envStr = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^\"|\"$/g, '');
});

const url = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/products?select=name,supplier_cost,price,categories(name,retail_markup_percentage)&limit=3`);
const req = https.request(url, {
  method: 'GET',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY}`
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});
req.end();

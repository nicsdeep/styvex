const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
}

// site-footer.tsx
replaceInFile('src/components/site-footer.tsx', [
    [/to="\/category\/womens-clothing"/g, 'to={"/category/womens-clothing" as any}'],
    [/to="\/category\/handbags"/g, 'to={"/category/handbags" as any}'],
    [/to="\/category\/jewelry"/g, 'to={"/category/jewelry" as any}']
]);

// product-card.tsx
replaceInFile('src/components/ui/product-card.tsx', [
    [/to={`\/product\/\${slug}`}/g, 'to={`/product/${slug}` as any}'],
    [/imageUrl\?: string \| null;/g, 'imageUrl?: string | null | undefined;']
]);

// cart.tsx
replaceInFile('src/routes/cart.tsx', [
    [/to={`\/product\/\${item.slug}`}/g, 'to={`/product/${item.slug}` as any}']
]);

// category.$slug.tsx
replaceInFile('src/routes/category.$slug.tsx', [
    [/imageUrl={product.product_images\?\.\[0\]\?\.image_url}/g, 'imageUrl={product.product_images?.[0]?.image_url || null}']
]);

// shop.tsx
replaceInFile('src/routes/shop.tsx', [
    [/imageUrl={product.product_images\?\.\[0\]\?\.image_url}/g, 'imageUrl={product.product_images?.[0]?.image_url || null}']
]);

// search.tsx
replaceInFile('src/routes/search.tsx', [
    [/primaryImage={/g, 'imageUrl={'],
    [/secondaryImage={[^}]*}/g, '']
]);

// wishlist.tsx
replaceInFile('src/routes/wishlist.tsx', [
    [/primaryImage={/g, 'imageUrl={'],
    [/secondaryImage={[^}]*}/g, '']
]);

// checkout.tsx
replaceInFile('src/routes/checkout.tsx', [
    [/item.variantId/g, 'item.id'],
    [/item.image/g, 'item.imageUrl']
]);

// product.$slug.tsx
replaceInFile('src/routes/product.$slug.tsx', [
    [/imageUrl: product.product_images\?\.\[0\]\?\.image_url,/g, 'imageUrl: product.product_images?.[0]?.image_url || "",'],
    [/disabled={!selectedSize \|\| !selectedColor \|\| !product.is_active}/g, 'disabled={!selectedSize || !selectedColor || product.is_active === false}']
]);

// index.tsx
replaceInFile('src/routes/index.tsx', [
    [/badges={product.price < 50 \? \["Bestseller"\] : undefined}/g, 'badges={product.price < 50 ? ["Bestseller"] : []}']
]);

console.log("TS fixes applied.");

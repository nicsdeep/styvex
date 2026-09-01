import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/shop")({
  component: ShopComponent,
});

function ShopComponent() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Sort images for each product so we get the primary one
      return (data || []).map(product => {
        if (product.product_images) {
          product.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
        }
        return product;
      });
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-10 md:px-12 lg:px-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-light uppercase tracking-widest text-foreground">Shop All</h1>
              <p className="mt-2 text-sm text-muted-foreground">Discover our entire collection.</p>
            </div>
            <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {products.length} Products
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {products.map((product) => {
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    slug={product.slug}
                    imageUrl={product.product_images?.[0]?.image_url || null}
                    categoryName={product.categories?.name || ""}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryComponent,
});

// Keep older storefront links working while the catalog uses its canonical slugs.
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "womens-clothing": "women-s-clothing",
};

function CategoryComponent() {
  const { slug } = Route.useParams();
  const categorySlug = CATEGORY_SLUG_ALIASES[slug] || slug;

  // First fetch the category to get its ID and Name
  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Then fetch products for that category
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["category-products", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .eq("category_id", category.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(product => {
        if (product.product_images) {
          product.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
        }
        return product;
      });
    },
    enabled: !!category?.id,
  });

  const isLoading = isCategoryLoading || isProductsLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 pb-10 pt-[7.5rem] md:px-12 md:pt-[9.5rem] lg:px-24">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-light uppercase tracking-widest text-foreground">
                {category?.name || "Category"}
              </h1>
              {category?.description && (
                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
            {!isLoading && (
              <div className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {products.length} Products
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
            </div>
          ) : !category ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <h2 className="text-xl font-light uppercase tracking-widest">Category Not Found</h2>
              <Link to="/shop" className="mt-4 border-b border-foreground pb-1 text-sm uppercase tracking-widest hover:text-muted-foreground">
                Return to Shop
              </Link>
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">No products found in this category.</p>
              <Link to="/shop" className="mt-4 border-b border-foreground pb-1 text-sm uppercase tracking-widest hover:text-muted-foreground">
                Shop All
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={Math.round(product.price * 1.2 * 100) / 100}
                    slug={product.slug}
                    imageUrl={product.product_images?.[0]?.image_url || null}
                    secondaryImageUrl={product.product_images?.[1]?.image_url || null}
                    categoryName={product.categories?.name || ""}
                    description={product.description}
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

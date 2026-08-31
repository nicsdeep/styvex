import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/ui/product-card";
import { CategoryNav } from "@/components/category-nav";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "STYVEX — Women's Fashion & Lifestyle" },
      {
        name: "description",
        content: "STYVEX is a women's fashion and lifestyle destination.",
      },
      { property: "og:title", content: "STYVEX — Women's Fashion & Lifestyle" },
      { property: "og:description", content: "STYVEX is a women's fashion and lifestyle destination." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { category } = Route.useSearch();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          categories(name),
          product_images(image_url)
        `)
        .order("created_at", { ascending: false });

      if (category) {
        // Find category id from slug
        const targetCategory = categories.find((c) => c.slug === category);
        if (targetCategory) {
          query = query.eq("category_id", targetCategory.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    // Only run product query once categories are loaded if a category filter is active
    enabled: category ? categories.length > 0 : true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 py-10 md:px-12 lg:px-24">
        <h1 className="mb-8 text-center text-3xl font-light uppercase tracking-widest text-foreground">
          {category ? categories.find(c => c.slug === category)?.name || "Collection" : "New Arrivals"}
        </h1>
        
        <CategoryNav 
          categories={categories} 
          activeCategorySlug={category} 
          className="mb-12" 
        />

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              // Extract first image if exists
              const firstImage = product.product_images?.[0]?.image_url;
              const categoryName = product.categories?.name;
              
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  slug={product.slug}
                  imageUrl={firstImage}
                  categoryName={categoryName}
                />
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

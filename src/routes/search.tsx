import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          is_featured,
          categories (name),
          product_images (image_url)
        `)
        .ilike("name", `%${debouncedSearchTerm}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: debouncedSearchTerm.length > 0,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-[1400px]">
          
          <div className="mb-16 max-w-2xl mx-auto">
            <h1 className="mb-8 text-3xl font-light uppercase tracking-widest text-foreground text-center">Search</h1>
            
            <div className="relative flex items-center border-b border-foreground pb-2">
              <SearchIcon className="h-6 w-6 text-muted-foreground absolute left-0" />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pl-10 pr-10 text-xl font-light focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
                autoFocus
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          {!debouncedSearchTerm ? (
            <div className="flex h-[40vh] items-center justify-center text-muted-foreground">
              <p>Type above to start searching...</p>
            </div>
          ) : isLoading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div>
              <p className="mb-6 text-sm text-muted-foreground">Found {searchResults.length} results for "{debouncedSearchTerm}"</p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {searchResults.map((product: any) => {
                  const images = product.product_images || [];
                  const primaryImage = images[0]?.image_url;
                  const secondaryImage = images[1]?.image_url;

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      slug={product.slug}
                      primaryImage={primaryImage}
                      secondaryImage={secondaryImage}
                      categoryName={product.categories?.name}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-[40vh] items-center justify-center flex-col gap-4 text-center">
              <p className="text-xl font-light text-foreground">No results found for "{debouncedSearchTerm}"</p>
              <p className="text-sm text-muted-foreground">Try checking your spelling or using more general terms.</p>
            </div>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

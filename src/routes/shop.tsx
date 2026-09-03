import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";
import { Filter, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  component: ShopComponent,
});

function ShopComponent() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price-low" | "price-high">("featured");
  
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    }
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products", selectedCategory, priceRange, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`*, categories(name, slug), product_images(image_url, display_order)`)
        .order("created_at", { ascending: false });
        
      if (selectedCategory) {
        // Need to join and filter by category slug or ID. 
        // We can just fetch all and filter in JS if it's easier, but let's try direct filter if possible.
        // Actually since we select `categories(...)`, filtering by foreign table is tricky in basic postgrest.
        // We'll filter in JS below for simplicity unless it's a huge catalog.
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = (data || []).map(product => {
        if (product.product_images) {
          product.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
        }
        return product;
      });
      
      if (selectedCategory) {
         filteredData = filteredData.filter(p => p.categories?.slug === selectedCategory);
      }
      
      if (priceRange === "under50") {
         filteredData = filteredData.filter(p => p.price < 50);
      } else if (priceRange === "50to100") {
         filteredData = filteredData.filter(p => p.price >= 50 && p.price <= 100);
      } else if (priceRange === "over100") {
         filteredData = filteredData.filter(p => p.price > 100);
      }

      filteredData.sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "featured") return Number(b.is_featured) - Number(a.is_featured);
        return 0;
      });
      
      return filteredData;
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 pt-[4.5rem] sm:pt-[6.5rem]">
        <div className="mx-auto flex max-w-[1600px] flex-col px-4 py-8 md:flex-row md:px-8 md:py-12">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 pr-8 mb-8 md:mb-0 hidden md:block">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 font-bold mb-6 text-foreground uppercase tracking-wider text-sm">
                <Filter className="w-4 h-4" />
                Filters
              </div>
              
              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    Categories <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "flex items-center gap-2 text-sm w-full text-left transition-colors",
                        selectedCategory === null ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn("w-4 h-4 border rounded flex items-center justify-center", selectedCategory === null ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                        {selectedCategory === null && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      All Products
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={cn(
                          "flex items-center gap-2 text-sm w-full text-left transition-colors",
                          selectedCategory === cat.slug ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                         <div className={cn("w-4 h-4 border rounded flex items-center justify-center", selectedCategory === cat.slug ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {selectedCategory === cat.slug && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <hr className="border-border/50" />
                
                {/* Price Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    Price <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: null, label: "Any Price" },
                      { id: "under50", label: "Under $50" },
                      { id: "50to100", label: "$50 to $100" },
                      { id: "over100", label: "Over $100" },
                    ].map(option => (
                      <button 
                        key={option.id || 'any'}
                        onClick={() => setPriceRange(option.id)}
                        className={cn(
                          "flex items-center gap-2 text-sm w-full text-left transition-colors",
                          priceRange === option.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                         <div className={cn("w-4 h-4 border rounded-full flex items-center justify-center", priceRange === option.id ? "border-primary" : "border-muted-foreground/30")}>
                          {priceRange === option.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="eyebrow text-brand">The Styvex edit</span>
                <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.035em] text-foreground md:text-5xl">
                  {selectedCategory 
                    ? categories.find(c => c.slug === selectedCategory)?.name || "Products" 
                    : "All Products"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">Featured first, with fresh pieces and everyday essentials.</p>
              </div>
              
              {/* Mobile filter button placeholder */}
              <button className="md:hidden flex items-center gap-2 border px-3 py-1.5 rounded text-sm font-medium">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>
            
            <div className="mb-7 flex flex-col gap-3 border-y border-border/70 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button onClick={() => setSelectedCategory(null)} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors", selectedCategory === null ? "border-ink bg-ink text-primary-foreground" : "border-border text-muted-foreground hover:border-brand hover:text-brand")}>All pieces</button>
                {categories.map((category) => (
                  <button key={category.id} onClick={() => setSelectedCategory(category.slug)} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors", selectedCategory === category.slug ? "border-ink bg-ink text-primary-foreground" : "border-border text-muted-foreground hover:border-brand hover:text-brand")}>{category.name}</button>
                ))}
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
                Sort
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-brand">
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>

            <div className="mb-5 text-sm text-muted-foreground">Showing {products.length} curated results</div>

            {isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
              </div>
            ) : products.length === 0 ? (
               <div className="flex flex-col items-center justify-center min-h-[30vh] text-center bg-muted/20 rounded-lg border border-dashed border-border/50">
                 <p className="text-muted-foreground">No products found matching your criteria.</p>
                 <button 
                   onClick={() => { setSelectedCategory(null); setPriceRange(null); }}
                   className="mt-4 text-sm font-medium text-primary hover:underline"
                 >
                   Clear all filters
                 </button>
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
                      badges={product.is_featured ? ["Bestseller"] : []}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

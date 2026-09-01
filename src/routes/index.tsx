import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, Truck, RefreshCcw, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "STYVEX — Modern Women's Fashion & Lifestyle" },
      {
        name: "description",
        content: "Discover the latest in women's fashion, handbags, jewelry, and lifestyle at STYVEX.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { category } = Route.useSearch();

  // Keep existing backend queries for New Arrivals/Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url)`)
        .order("created_at", { ascending: false });

      if (category) {
        const targetCategory = categories.find((c) => c.slug === category);
        if (targetCategory) {
          query = query.eq("category_id", targetCategory.id);
        }
      }

      const { data, error } = await query.limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: category ? categories.length > 0 : true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] w-full min-h-[600px]">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2940&auto=format&fit=crop"
            alt="Editorial fashion showcase"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="mb-6 max-w-4xl text-4xl font-light uppercase tracking-[0.2em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Elevate Your Everyday
            </h1>
            <p className="mb-10 max-w-lg text-sm font-light text-white/90 sm:text-base md:text-lg">
              Discover the new collection. Curated pieces for the modern aesthetic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/shop"
                className="bg-white px-8 py-4 text-xs font-semibold uppercase tracking-widest text-black transition-transform hover:scale-105"
              >
                Shop the Collection
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-24 px-6 md:px-12 lg:px-24 max-w-[1600px] mx-auto">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">Featured Categories</h2>
            <Link to="/shop" className="text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link to="/?category=womens-clothing" className="group relative aspect-[4/5] md:aspect-square overflow-hidden bg-muted">
              <img 
                src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1287&auto=format&fit=crop" 
                alt="Women's Clothing" 
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-2xl font-light uppercase tracking-widest text-white mb-2">Clothing</h3>
                <span className="inline-block border-b border-white text-sm font-medium text-white pb-1">Explore</span>
              </div>
            </Link>
            <Link to="/?category=jewelry" className="group relative aspect-[4/5] md:aspect-square overflow-hidden bg-muted">
              <img 
                src="https://images.unsplash.com/photo-1599643478514-4a8e235a9602?q=80&w=1287&auto=format&fit=crop" 
                alt="Jewelry" 
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-2xl font-light uppercase tracking-widest text-white mb-2">Jewelry</h3>
                <span className="inline-block border-b border-white text-sm font-medium text-white pb-1">Explore</span>
              </div>
            </Link>
          </div>
        </section>

        {/* New Arrivals Grid */}
        <section className="bg-secondary/30 py-24 px-6 md:px-12 lg:px-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Placeholders for category blocks */}
              {["Women's Clothing", "Handbags & Bags", "Jewelry", "Lifestyle"].map((cat) => (
                <Link key={cat} to="/shop" className="group relative aspect-square overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-secondary/10 transition-colors group-hover:bg-black/10" />
                  <div className="absolute inset-x-0 bottom-8 flex justify-center">
                    <span className="bg-background/95 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                      {cat}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 3. New Arrivals (Driven by actual DB data) */}
        <section className="py-16 px-6 md:px-12 lg:px-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">
                New Arrivals
              </h2>
              <Link to="/shop" className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground hover:underline sm:flex">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex min-h-[30vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">New products arriving soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {products.map((product) => {
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
                      badges={["New"]}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 5. Featured Collection */}
        <section className="my-20 bg-muted">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-square lg:aspect-auto min-h-[50vh] bg-secondary/30" />
            <div className="flex flex-col justify-center p-12 lg:p-24">
              <span className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                The Summer Edit
              </span>
              <h2 className="mb-6 text-3xl font-light uppercase tracking-widest text-foreground sm:text-4xl">
                Effortless Elegance
              </h2>
              <p className="mb-10 max-w-md text-muted-foreground">
                Curated pieces designed to transition seamlessly from day to night. Discover lightweight fabrics, relaxed silhouettes, and timeless accessories.
              </p>
              <div>
                <Link
                  to="/collection/summer-edit"
                  className="inline-flex border border-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Explore Collection
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Trending Products */}
        <section className="py-16 px-6 md:px-12 lg:px-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">
                Trending Now
              </h2>
            </div>
            {/* Empty state for trending products */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
               {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group relative flex flex-col bg-background">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted" />
                  <div className="flex flex-col gap-2 pt-4">
                    <div className="h-3 w-1/3 bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/4 bg-muted rounded" />
                  </div>
                </div>
               ))}
            </div>
          </div>
        </section>

        {/* 6. Editorial / Lifestyle */}
        <section className="py-20 px-6 md:px-12 lg:px-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="aspect-[4/5] bg-muted" />
              <div className="aspect-[4/5] bg-muted md:mt-16" />
              <div className="aspect-[4/5] bg-muted" />
            </div>
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">
                Follow <a href="#" className="font-semibold">@STYVEX</a>
              </h2>
            </div>
          </div>
        </section>

        {/* 7. Trust / Service Section */}
        <section className="border-t border-border bg-background py-16 px-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <Truck className="mb-4 h-6 w-6 text-foreground" strokeWidth={1.5} />
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground">Complimentary Shipping</h3>
                <p className="text-xs text-muted-foreground">On all U.S. orders over $150</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <RefreshCcw className="mb-4 h-6 w-6 text-foreground" strokeWidth={1.5} />
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground">Easy Returns</h3>
                <p className="text-xs text-muted-foreground">30-day return policy for peace of mind</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="mb-4 h-6 w-6 text-foreground" strokeWidth={1.5} />
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground">Secure Checkout</h3>
                <p className="text-xs text-muted-foreground">Your payment information is always protected</p>
              </div>
            </div>
          </div>
        </section>

        {/* As Seen On Social */}
        <section className="py-24 px-6 md:px-12 lg:px-24 max-w-[1600px] mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-light uppercase tracking-widest text-foreground mb-4">#Styvex</h2>
            <p className="text-sm text-muted-foreground">Follow us on Instagram @styvex</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1000&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1509631179647-0c708c226c45?q=80&w=1000&auto=format&fit=crop"
            ].map((img, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden bg-muted cursor-pointer">
                <img src={img} alt={`Social ${i}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white font-medium tracking-widest uppercase text-xs transition-opacity">Shop Look</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

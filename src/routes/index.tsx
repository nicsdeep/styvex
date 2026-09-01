import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, RefreshCcw, ShieldCheck, Instagram } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
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

// --- COMPONENTS ---

// 1. Trust Bar
function TrustBar() {
  return (
    <div className="w-full bg-black py-3 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:gap-4 md:px-8 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <span>Complimentary Shipping Over $150</span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <RefreshCcw className="h-4 w-4" />
          <span>30-Day Easy Returns</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure Checkout</span>
        </div>
      </div>
    </div>
  );
}

// 2. Split Hero Section
function SplitHero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col lg:flex-row w-full bg-background">
      {/* Left / Top Side */}
      <div className="relative flex flex-1 flex-col justify-center px-8 py-16 sm:px-12 md:px-24 lg:py-24 z-10">
        <h1 className="mb-6 max-w-2xl text-4xl font-semibold uppercase tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl animate-in fade-in slide-in-from-left-8 duration-1000">
          Define Your <br className="hidden sm:block" /> Signature.
        </h1>
        <p className="mb-10 max-w-md text-sm text-muted-foreground sm:text-base md:text-lg animate-in fade-in slide-in-from-left-8 duration-1000" style={{ animationDelay: '200ms', fillMode: 'forwards' }}>
          Discover the latest arrivals in women's fashion. Curated for the modern lifestyle. Quality that speaks for itself.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: '400ms', fillMode: 'forwards' }}>
          <Link
            to="/shop"
            className="flex items-center justify-center bg-foreground px-8 py-4 text-xs font-bold uppercase tracking-widest text-background transition-transform hover:scale-105"
          >
            Shop All
          </Link>
          <Link
            to="/category/womens-clothing"
            className="flex items-center justify-center border border-foreground bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-widest text-foreground transition-transform hover:scale-105 hover:bg-foreground hover:text-background"
          >
            Shop Clothing
          </Link>
        </div>
      </div>

      {/* Right / Bottom Side - Images */}
      <div className="relative flex-1 hidden lg:flex h-full min-h-[500px]">
        <div className="absolute inset-0 bg-muted/20" />
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop"
          alt="Fashion Editorial"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute bottom-12 left-12 bg-white/90 p-6 backdrop-blur-sm shadow-xl">
           <h3 className="text-xl font-medium tracking-tight mb-2">The Spring Edit</h3>
           <Link to="/category/handbags" className="text-sm font-semibold uppercase tracking-widest border-b border-black pb-1 hover:text-muted-foreground transition-colors">
              Explore Handbags
           </Link>
        </div>
      </div>
    </section>
  );
}

// 3. Category Pills (Horizontal scrolling)
function CategoryPills() {
  const categories = [
    { name: "New In", link: "/shop" },
    { name: "Clothing", link: "/category/womens-clothing" },
    { name: "Handbags", link: "/category/handbags" },
    { name: "Jewelry", link: "/category/jewelry" },
    { name: "Accessories", link: "/category/fashion-accessories" },
    { name: "Lifestyle", link: "/category/lifestyle" },
  ];

  return (
    <div className="w-full border-b border-border bg-background py-6">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex overflow-x-auto pb-4 pt-2 hide-scrollbar gap-4 sm:gap-6 sm:justify-center">
          {categories.map((cat, i) => (
             <Link 
              key={i} 
              to={cat.link}
              className="whitespace-nowrap rounded-full border border-border bg-muted/50 px-6 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
             >
               {cat.name}
             </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. Draggable Product Carousel
function ProductCarousel({ products, title, viewAllLink }: { products: any[], title: string, viewAllLink: string }) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true
  });

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="mb-10 flex items-end justify-between border-b border-border pb-6">
          <h2 className="text-3xl font-semibold uppercase tracking-tight text-foreground">
            {title}
          </h2>
          <Link to={viewAllLink} className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground sm:flex transition-colors">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {products.length === 0 ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4 touch-pan-y">
              {products.map((product) => (
                <div key={product.id} className="min-w-0 flex-[0_0_80%] pl-4 sm:flex-[0_0_45%] lg:flex-[0_0_25%]">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    slug={product.slug}
                    imageUrl={product.product_images?.[0]?.image_url}
                    categoryName={product.categories?.name}
                    badges={product.price < 50 ? ["Bestseller"] : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// 5. Featured UGC / Social Proof
function SocialProof() {
  const posts = [
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0c708c226c45?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492446845049-9c50cc313f00?q=80&w=800&auto=format&fit=crop"
  ];

  return (
    <section className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="mb-12 flex flex-col items-center text-center">
          <Instagram className="mb-4 h-8 w-8 text-foreground" />
          <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
            Styled by You
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Tag @STYVEX and use #StyvexStyle to be featured on our page.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {posts.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden bg-muted cursor-pointer rounded-sm">
              <img src={img} alt={`Social ${i}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30 flex items-center justify-center">
                <span className="translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 text-white font-bold tracking-widest uppercase text-xs">
                  Shop Look
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- MAIN PAGE ---

function Index() {
  // Fetch Products
  const { data: newArrivals = [] } = useQuery({
    queryKey: ["products-new"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      
      return (data || []).map(product => {
        if (product.product_images) {
          product.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
        }
        return product;
      });
    },
  });

  const { data: trendingProducts = [] } = useQuery({
    queryKey: ["products-trending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .order("price", { ascending: false }) 
        .limit(8);
      if (error) throw error;
      
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
      <main className="flex-1">
        
        {/* Modern Conversion Focused Layout */}
        <TrustBar />
        <SplitHero />
        <CategoryPills />

        {/* Carousel 1 */}
        <ProductCarousel 
          title="New Arrivals" 
          products={newArrivals} 
          viewAllLink="/shop" 
        />

        {/* Mid-page Featured Collection Banner */}
        <section className="px-6 md:px-12 lg:px-24 max-w-[1600px] mx-auto my-8">
          <div className="relative overflow-hidden rounded-sm bg-muted aspect-[16/9] md:aspect-[21/9]">
            <img 
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop" 
              alt="Lifestyle Collection" 
              className="absolute inset-0 h-full w-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <h2 className="mb-4 text-3xl font-bold uppercase tracking-widest text-white sm:text-5xl drop-shadow-lg">
                The Weekend Edit
              </h2>
              <p className="mb-8 max-w-lg text-sm font-medium text-white/90 sm:text-base drop-shadow-md">
                Unwind in style with our latest collection of premium loungewear and lifestyle essentials.
              </p>
              <Link
                to="/category/lifestyle"
                className="bg-white px-8 py-3 text-xs font-bold uppercase tracking-widest text-black transition-transform hover:scale-105"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* Carousel 2 */}
        <ProductCarousel 
          title="Trending Now" 
          products={trendingProducts} 
          viewAllLink="/shop" 
        />

        {/* UGC Section */}
        <SocialProof />

      </main>
      <SiteFooter />
      
      {/* Global Style overrides for hiding scrollbars on webkit but allowing scroll */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

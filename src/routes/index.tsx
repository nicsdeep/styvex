import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, RefreshCcw, ShieldCheck } from "lucide-react";
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

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2940&auto=format&fit=crop",
    title: "Elevate Your Everyday",
    subtitle: "Discover the new collection. Curated pieces for the modern aesthetic.",
    ctaText: "Shop the Collection",
    ctaLink: "/shop"
  },
  {
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=2940&auto=format&fit=crop",
    title: "Summer Essentials",
    subtitle: "Lightweight fabrics and relaxed silhouettes for warmer days.",
    ctaText: "Explore Summer",
    ctaLink: "/category/womens-clothing"
  },
  {
    image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=2940&auto=format&fit=crop",
    title: "Timeless Accessories",
    subtitle: "Handcrafted details to complete your look.",
    ctaText: "Shop Accessories",
    ctaLink: "/category/handbags"
  }
];

function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 6000, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <section className="relative h-[80vh] w-full min-h-[600px] overflow-hidden bg-muted">
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {HERO_SLIDES.map((slide, index) => (
            <div key={index} className="relative flex-[0_0_100%] h-full w-full min-w-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h1 className="mb-6 max-w-4xl text-4xl font-light uppercase tracking-[0.2em] text-white sm:text-5xl md:text-6xl lg:text-7xl opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards" style={{ animationDelay: '300ms' }}>
                  {slide.title}
                </h1>
                <p className="mb-10 max-w-lg text-sm font-light text-white/90 sm:text-base md:text-lg opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards" style={{ animationDelay: '500ms' }}>
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards" style={{ animationDelay: '700ms' }}>
                  <Link
                    to={slide.ctaLink}
                    className="bg-white px-8 py-4 text-xs font-semibold uppercase tracking-widest text-black transition-transform hover:scale-105"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Carousel Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-10">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`h-1.5 transition-all duration-500 ease-in-out ${selectedIndex === idx ? "w-8 bg-white" : "w-2 bg-white/50"} rounded-full`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function Index() {
  // Fetch New Arrivals
  const { data: newArrivals = [], isLoading: isLoadingNew } = useQuery({
    queryKey: ["products-new"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      
      return (data || []).map(product => {
        if (product.product_images) {
          product.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
        }
        return product;
      });
    },
  });

  // Fetch Trending (just taking next 4 products for now to simulate)
  const { data: trendingProducts = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ["products-trending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .order("price", { ascending: false }) // Simulate trending by price
        .limit(4);
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
        
        <HeroCarousel />

        {/* Featured Categories */}
        <section className="py-24 px-6 md:px-12 lg:px-24 max-w-[1600px] mx-auto">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">Featured Categories</h2>
            <Link to="/shop" className="text-sm font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link to="/category/womens-clothing" className="group relative aspect-[4/5] md:aspect-[16/9] overflow-hidden bg-muted">
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
            <Link to="/category/jewelry" className="group relative aspect-[4/5] md:aspect-[16/9] overflow-hidden bg-muted">
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

        {/* 3. New Arrivals */}
        <section className="py-16 px-6 md:px-12 lg:px-24 bg-secondary/20">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">
                New Arrivals
              </h2>
              <Link to="/shop" className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground hover:underline sm:flex">
                Shop All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoadingNew ? (
              <div className="flex min-h-[30vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
              </div>
            ) : newArrivals.length === 0 ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">New products arriving soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {newArrivals.map((product) => {
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
            
            <div className="mt-12 flex justify-center sm:hidden">
              <Link to="/shop" className="inline-flex border border-foreground px-8 py-3 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background">
                View All Arrivals
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Featured Collection */}
        <section className="my-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 mx-auto max-w-[1600px]">
            <div className="aspect-square lg:aspect-auto min-h-[50vh] bg-secondary/30 relative overflow-hidden">
               <img 
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop" 
                alt="Summer Edit" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-12 lg:p-24 bg-muted/30">
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
                  to="/category/womens-clothing"
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
            
            {isLoadingTrending ? (
              <div className="flex min-h-[30vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
              </div>
            ) : trendingProducts.length === 0 ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">Check back for trending products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {trendingProducts.map((product) => {
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
          </div>
        </section>

        {/* 6. Editorial / Lifestyle */}
        <section className="py-20 px-6 md:px-12 lg:px-24 border-t border-border">
          <div className="mx-auto max-w-[1400px]">
            <div className="mt-8 text-center mb-16">
              <h2 className="text-2xl font-light uppercase tracking-widest text-foreground">
                Follow <a href="https://instagram.com" target="_blank" rel="noreferrer" className="font-semibold hover:underline">@STYVEX</a>
              </h2>
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
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, RefreshCcw, ShieldCheck, Headset } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/ui/product-card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const features = [
    { icon: Truck, title: "Free Shipping", subtitle: "On orders over $50" },
    { icon: ShieldCheck, title: "Secure Payments", subtitle: "100% secure checkout" },
    { icon: RefreshCcw, title: "Easy Returns", subtitle: "30-day return policy" },
    { icon: Headset, title: "24/7 Support", subtitle: "Always here to help" },
  ];

  return (
    <section className="mx-5 mt-8 rounded-2xl border border-border/70 bg-card py-7 md:mx-10 md:mt-12 lg:mx-14">
      <div className="mx-auto grid max-w-[1540px] grid-cols-2 gap-x-4 gap-y-7 px-5 md:grid-cols-4 md:gap-6 md:px-10 lg:px-14">
        {features.map((feat, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <feat.icon className="h-5 w-5 text-brand stroke-[1.5]" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">{feat.title}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{feat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=85&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=85&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=1600&auto=format&fit=crop",
];

const CATEGORY_IMAGES: Record<string, string> = {
  "womens-clothing": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
  handbags: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400&q=80",
  jewelry: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=85",
  "fashion-accessories": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80",
  lifestyle: "https://images.unsplash.com/photo-1499939667766-4afceb292d05?w=400&q=80",
};
const DEFAULT_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80";

// 2. Hero Section — restrained editorial image rotation
function Hero() {
  const [activeHeroImage, setActiveHeroImage] = useState(0);

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 7000);

    return () => window.clearInterval(rotation);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative mx-auto min-h-[78vh] max-w-[1540px]">
        <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
          {HERO_IMAGES.map((image, index) => (
            <img
              key={image}
              src={image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover object-[82%_center] transition-opacity duration-[1800ms] ease-out ${
                index === activeHeroImage ? "opacity-100" : "opacity-0"
              }`}
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, transparent 34%, black 68%, black 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 34%, black 68%, black 100%)",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/10 via-transparent to-background/15" />
        </div>

        {/* Left Content */}
        <div className="relative z-10 flex min-h-[68vh] max-w-2xl flex-col justify-center px-5 py-20 md:px-10 lg:min-h-[78vh] lg:px-14">
          <span className="eyebrow mb-7 text-brand animate-in fade-in slide-in-from-bottom-4">
            The new season
          </span>
          <h1 className="font-display text-balance mb-7 max-w-2xl text-5xl font-semibold leading-[0.96] tracking-[-0.045em] text-ink md:text-7xl lg:text-[5.8rem] animate-in fade-in slide-in-from-bottom-6" style={{ animationDelay: '100ms' }}>
            Made to be noticed. Worn your way.
          </h1>
          <p className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: '200ms' }}>
            A considered edit of fashion, jewelry, and everyday pieces that make the ordinary feel exceptional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10" style={{ animationDelay: '300ms' }}>
            <Link
              to="/shop"
              className="flex items-center justify-center rounded-full bg-brand px-8 py-4 text-sm font-bold text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-ink luxury-shadow"
            >
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to={"/category/womens-clothing" as any}
              className="flex items-center justify-center rounded-full border border-foreground/20 bg-background/40 px-8 py-4 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:bg-background"
            >
              Explore Collection
            </Link>
          </div>

          <div className="mt-14 border-l border-brand pl-4 animate-in fade-in" style={{ animationDelay: '500ms' }}>
            <span className="eyebrow text-muted-foreground">Considered pieces. Exceptional everyday.</span>
          </div>
        </div>

        <div className="relative mx-5 mb-12 h-[390px] overflow-hidden rounded-[2rem] bg-ink md:mx-10 lg:hidden">
          {HERO_IMAGES.map((image, index) => (
            <img
              key={image}
              src={image}
              alt={index === activeHeroImage ? "Editorial STYVEX fashion collection" : ""}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1800ms] ease-out ${
                index === activeHeroImage ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// 3. Shop by Categories (Image Cards)
function ShopByCategories() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1540px] px-5 md:px-10 lg:px-14">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="eyebrow text-brand">Curated for you</span>
            <h2 className="font-display mt-3 text-4xl font-semibold tracking-[-0.035em] text-ink md:text-5xl">Shop by mood</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand sm:flex">
            View All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-6">
          {categories.map((cat) => (
             <Link key={cat.id} to="/category/$slug" params={{ slug: cat.slug }} className="group flex flex-col gap-3">
               <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted luxury-shadow">
                 <img src={CATEGORY_IMAGES[cat.slug] || DEFAULT_CATEGORY_IMAGE} alt={cat.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="font-display text-xl font-semibold tracking-[-0.025em]">{cat.name}</span>
                   <span className="text-xs text-muted-foreground">Explore the edit</span>
                 </div>
                 <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover:bg-brand group-hover:text-accent-foreground">
                   <ArrowRight className="h-3 w-3" />
                 </div>
               </div>
             </Link>
          ))}
        </div>
      </div>
    </section>
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
    <section className="py-8 md:py-16">
      <div className="mx-auto max-w-[1540px] px-5 md:px-10 lg:px-14">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.035em] text-ink md:text-5xl">
            {title}
          </h2>
          <Link to={viewAllLink} className="hidden items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand md:flex">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {products.length === 0 ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          </div>
        ) : (
          <div className="overflow-hidden -mx-4 px-4" ref={emblaRef}>
            <div className="flex -ml-4 touch-pan-y py-4">
              {products.map((product, i) => (
                <div key={product.id} className="min-w-0 flex-[0_0_85%] pl-4 sm:flex-[0_0_45%] lg:flex-[0_0_20%] xl:flex-[0_0_16.666%]">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.price * 1.2} // Simulate compare at price for layout
                    slug={product.slug}
                    imageUrl={product.product_images?.[0]?.image_url}
                    secondaryImageUrl={product.product_images?.[1]?.image_url}
                    categoryName={product.categories?.name}
                    description={product.description}
                    badges={i === 0 ? ["New"] : i === 1 ? ["-20%"] : i === 2 ? ["Bestseller"] : []}
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

// 5. Promo Banners
function PromoBanners() {
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 15, mins: 45, secs: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, mins, secs } = prev;
        if (secs > 0) secs--;
        else {
          secs = 59;
          if (mins > 0) mins--;
          else {
            mins = 59;
            if (hours > 0) hours--;
            else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mx-auto max-w-[1540px] px-5 py-16 md:px-10 lg:px-14">
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Flash Sale Banner */}
        <div className="relative flex min-h-[350px] flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-ink p-8 text-primary-foreground md:p-12">
          <span className="bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm shadow-sm">
            Flash Sale
          </span>
          <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-2">Up To 70% Off</h3>
          <p className="text-white/80 mb-8 max-w-sm">Grab our best deals of the season. Limited quantities available.</p>
          
          <div className="flex gap-4 mb-8">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-semibold text-white/70">Days</span>
            </div>
            <span className="text-3xl font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-semibold text-white/70">Hours</span>
            </div>
            <span className="text-3xl font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{String(timeLeft.mins).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-semibold text-white/70">Mins</span>
            </div>
            <span className="text-3xl font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{String(timeLeft.secs).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-semibold text-white/70">Secs</span>
            </div>
          </div>
          
          <Link to="/shop" className="w-fit rounded-full bg-background px-8 py-3 text-sm font-bold text-brand shadow-lg transition-transform hover:-translate-y-0.5">
            Shop Sale Now
          </Link>
          
          {/* Decorative Shoe/Item image (Placeholder) */}
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" alt="Sale Item" className="absolute -bottom-10 -right-10 w-64 h-64 object-cover rounded-full mix-blend-multiply opacity-50 rotate-[-20deg]" />
        </div>

        {/* New Collection Banner */}
        <div className="relative flex min-h-[350px] flex-col justify-center overflow-hidden rounded-[2rem] bg-ink p-8 text-primary-foreground md:p-12">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
            New Collection
          </span>
          <h3 className="font-display mb-4 text-4xl font-semibold leading-tight md:text-5xl">The effortless edit</h3>
          <p className="text-white/70 mb-8 max-w-sm text-sm">Discover the latest trends and fresh styles designed to make you stand out this season.</p>
          
          <Link to="/shop" className="relative z-10 w-fit rounded-full bg-background px-8 py-3 text-sm font-bold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
            Shop Collection
          </Link>

          <div className="absolute inset-y-0 right-0 w-1/2">
             <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" alt="New Collection" className="h-full w-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-[#111] to-transparent" />
          </div>
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
        .limit(10);
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
        .limit(10);
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
      <main className="flex-1 pb-10 pt-[4.5rem] sm:pt-[6.5rem]">
        
        <Hero />
        <TrustBar />
        <ShopByCategories />

        <ProductCarousel 
          title="New Arrivals" 
          products={newArrivals} 
          viewAllLink="/shop" 
        />

        <ProductCarousel 
          title="Best Sellers" 
          products={trendingProducts} 
          viewAllLink="/shop" 
        />

        <PromoBanners />

      </main>
      <SiteFooter />
    </div>
  );
}


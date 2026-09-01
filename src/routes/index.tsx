import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, RefreshCcw, ShieldCheck, Headset, Instagram, Clock } from "lucide-react";
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
    <div className="w-full bg-background border-b border-border/50 py-6">
      <div className="mx-auto max-w-7xl px-4 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, i) => (
          <div key={i} className="flex items-center gap-4">
            <feat.icon className="h-6 w-6 text-foreground stroke-[1.5]" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">{feat.title}</span>
              <span className="text-xs text-muted-foreground">{feat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Hero Section with Floating Glassmorphism Cards
function Hero({ products = [] }: { products: any[] }) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(p);

  return (
    <section className="relative w-full bg-[#fcfcfc] overflow-hidden">
      <div className="mx-auto max-w-[1600px] grid lg:grid-cols-2 min-h-[80vh] md:min-h-[600px]">
        {/* Left Content */}
        <div className="relative z-10 flex flex-col justify-center px-6 py-16 md:px-12 lg:px-24">
          <span className="text-[#e55039] font-bold text-xs uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4">
            Trending Now
          </span>
          <h1 className="mb-6 max-w-xl text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-6" style={{ animationDelay: '100ms' }}>
            Discover Products You'll Love
          </h1>
          <p className="mb-10 max-w-md text-base text-muted-foreground md:text-lg animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: '200ms' }}>
            Shop the latest trending products curated for modern lifestyles. Premium quality meets everyday elegance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10" style={{ animationDelay: '300ms' }}>
            <Link
              to="/shop"
              className="flex items-center justify-center bg-[#e55039] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#d44530] hover:scale-105 rounded-md shadow-lg shadow-[#e55039]/20"
            >
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to={"/category/womens-clothing" as any}
              className="flex items-center justify-center bg-white border border-border px-8 py-4 text-sm font-bold text-foreground transition-all hover:bg-muted hover:scale-105 rounded-md shadow-sm"
            >
              Explore Collection
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-4 animate-in fade-in" style={{ animationDelay: '500ms' }}>
            <div className="flex -space-x-2">
              <img src="https://i.pravatar.cc/100?img=1" className="w-8 h-8 rounded-full border-2 border-white" alt="Avatar" />
              <img src="https://i.pravatar.cc/100?img=2" className="w-8 h-8 rounded-full border-2 border-white" alt="Avatar" />
              <img src="https://i.pravatar.cc/100?img=3" className="w-8 h-8 rounded-full border-2 border-white" alt="Avatar" />
              <img src="https://i.pravatar.cc/100?img=4" className="w-8 h-8 rounded-full border-2 border-white" alt="Avatar" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Loved by 50,000+ customers worldwide</span>
          </div>
        </div>

        {/* Right Content - Visual Composition */}
        <div className="relative hidden lg:flex items-center justify-center p-12">
          {/* Abstract Red/Orange Background Shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-[#e55039] to-[#ff7b54] rounded-[100px] rotate-[-15deg] opacity-90 blur-3xl" />
          
          {/* Main Hero Image */}
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop" 
            alt="Fashion Model" 
            className="relative z-10 w-full max-w-md h-auto object-contain drop-shadow-2xl" 
          />

          {/* Floating Product Cards (Glassmorphism) */}
          {products[0] && (
            <div className="absolute top-[15%] left-[5%] z-20 bg-white/70 backdrop-blur-md p-3 rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-bounce-slow">
              <img src={products[0].product_images?.[0]?.image_url} className="w-20 h-20 object-cover rounded-xl bg-white mix-blend-multiply" />
              <div className="text-center">
                <p className="text-[10px] font-bold leading-tight max-w-[80px] truncate">{products[0].name}</p>
                <p className="text-[10px] text-muted-foreground">{formatPrice(products[0].price)}</p>
              </div>
            </div>
          )}

          {products[1] && (
            <div className="absolute top-[40%] right-[5%] z-20 bg-white/70 backdrop-blur-md p-3 rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <img src={products[1].product_images?.[0]?.image_url} className="w-20 h-20 object-cover rounded-xl bg-white mix-blend-multiply" />
              <div className="text-center">
                <p className="text-[10px] font-bold leading-tight max-w-[80px] truncate">{products[1].name}</p>
                <p className="text-[10px] text-muted-foreground">{formatPrice(products[1].price)}</p>
              </div>
            </div>
          )}

          {products[2] && (
            <div className="absolute bottom-[20%] left-[10%] z-20 bg-white/70 backdrop-blur-md p-3 rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-bounce-slow" style={{ animationDelay: '2s' }}>
              <img src={products[2].product_images?.[0]?.image_url} className="w-20 h-20 object-cover rounded-xl bg-white mix-blend-multiply" />
              <div className="text-center">
                <p className="text-[10px] font-bold leading-tight max-w-[80px] truncate">{products[2].name}</p>
                <p className="text-[10px] text-muted-foreground">{formatPrice(products[2].price)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// 3. Shop by Categories (Image Cards)
function ShopByCategories() {
  const categories = [
    { name: "Clothing", link: "/category/womens-clothing", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80" },
    { name: "Handbags", link: "/category/handbags", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400&q=80" },
    { name: "Jewelry", link: "/category/jewelry", img: "https://images.unsplash.com/photo-1599643477874-5c866f5c8cb7?w=400&q=80" },
    { name: "Accessories", link: "/category/fashion-accessories", img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80" },
    { name: "Lifestyle", link: "/category/lifestyle", img: "https://images.unsplash.com/photo-1499939667766-4afceb292d05?w=400&q=80" },
    { name: "New Arrivals", link: "/shop", img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80" },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Shop by Categories</h2>
          <Link to="/shop" className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
            View All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
             <Link key={i} to={cat.link as any} className="group flex flex-col gap-3 bg-muted/30 p-4 rounded-2xl hover:bg-muted transition-colors">
               <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                 <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="font-bold text-sm">{cat.name}</span>
                   <span className="text-xs text-muted-foreground">Shop Now</span>
                 </div>
                 <div className="h-6 w-6 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:bg-foreground group-hover:text-background transition-colors">
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
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <Link to={viewAllLink} className="hidden items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground md:flex transition-colors">
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
                    categoryName={product.categories?.name}
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
    <section className="py-16 mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Flash Sale Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff7b54] to-[#e55039] p-8 md:p-12 text-white flex flex-col justify-center min-h-[350px]">
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
          
          <Link to="/shop" className="w-fit bg-white text-[#e55039] px-8 py-3 rounded-md font-bold text-sm shadow-lg hover:scale-105 transition-transform">
            Shop Sale Now
          </Link>
          
          {/* Decorative Shoe/Item image (Placeholder) */}
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" alt="Sale Item" className="absolute -bottom-10 -right-10 w-64 h-64 object-cover rounded-full mix-blend-multiply opacity-50 rotate-[-20deg]" />
        </div>

        {/* New Collection Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111] p-8 md:p-12 text-white flex flex-col justify-center min-h-[350px]">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
            New Collection
          </span>
          <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-4">Summer 2025</h3>
          <p className="text-white/70 mb-8 max-w-sm text-sm">Discover the latest trends and fresh styles designed to make you stand out this season.</p>
          
          <Link to="/shop" className="w-fit bg-white text-black px-8 py-3 rounded-md font-bold text-sm shadow-lg hover:scale-105 transition-transform relative z-10">
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
      <main className="flex-1 pb-10">
        
        <Hero products={newArrivals.slice(0, 3)} />
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
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}


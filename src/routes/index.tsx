import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

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

// 01. Premium Hero
function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#faf9f8]">
      <div className="mx-auto flex max-w-[1600px] flex-col-reverse lg:flex-row min-h-[70vh] lg:min-h-[85vh]">
        {/* Left Content */}
        <div className="flex flex-1 flex-col justify-center px-6 py-16 md:px-12 lg:px-24">
          <span className="mb-6 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-foreground/60 animate-in fade-in slide-in-from-bottom-4">
            The New Season
          </span>
          <h1 className="mb-8 max-w-xl font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl xl:text-8xl animate-in fade-in slide-in-from-bottom-6" style={{ animationDelay: '100ms' }}>
            Style, made <br /> for everyday.
          </h1>
          <p className="mb-12 max-w-md text-base leading-relaxed text-foreground/70 md:text-lg animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: '200ms' }}>
            Elevate your wardrobe with our meticulously curated collection. Designed for the modern woman who values quiet luxury and effortless sophistication.
          </p>
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center animate-in fade-in slide-in-from-bottom-10" style={{ animationDelay: '300ms' }}>
            <Link
              to="/shop"
              className="group inline-flex h-12 items-center justify-center bg-foreground px-8 text-sm font-medium tracking-wide text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop New Arrivals
            </Link>
            <Link
              to={"/category/womens-clothing" as any}
              className="group inline-flex h-12 items-center justify-center px-4 text-sm font-medium tracking-wide text-foreground/80 transition-colors hover:text-foreground"
            >
              <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-foreground">Explore Collection</span>
            </Link>
          </div>
        </div>

        {/* Right Content - Hero Image */}
        <div className="relative flex flex-1 items-center justify-center bg-[#f0eee9]">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop" 
            alt="Fashion Editorial" 
            className="h-full w-full object-cover lg:absolute lg:inset-0" 
          />
        </div>
      </div>
    </section>
  );
}

// 02. Shop by Category
function ShopByCategories() {
  const categories = [
    { name: "Clothing", link: "/category/womens-clothing", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80" },
    { name: "Handbags", link: "/category/handbags", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80" },
    { name: "Jewelry", link: "/category/jewelry", img: "https://images.unsplash.com/photo-1515562141207-7a8ef61950f6?w=800&q=80" },
  ];

  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="mb-12 flex items-end justify-between border-b border-border/60 pb-4">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">Categories</h2>
          <Link to="/shop" className="group flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-foreground/70 hover:text-foreground">
            View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-10">
          {categories.map((cat, i) => (
             <Link key={i} to={cat.link as any} className="group relative flex flex-col overflow-hidden">
               <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f5]">
                 <img src={cat.img} alt={cat.name} className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                 <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:bg-black/20" />
               </div>
               <div className="absolute bottom-0 left-0 p-8 text-white">
                 <h3 className="font-serif text-2xl font-medium tracking-wide">{cat.name}</h3>
                 <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
                   <span className="border-b border-white/60 pb-0.5 transition-colors group-hover:border-white">Explore</span>
                 </div>
               </div>
             </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// 03. New Arrivals / Trending Grid
function ProductGrid({ products, title, viewAllLink }: { products: any[], title: string, viewAllLink: string }) {
  if (!products.length) return null;
  
  return (
    <section className="py-20 md:py-32 bg-[#faf9f8]">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="mb-12 flex items-end justify-between border-b border-border/60 pb-4">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          <Link to={viewAllLink} className="group flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-foreground/70 hover:text-foreground">
            View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              slug={product.slug}
              imageUrl={product.product_images?.[0]?.image_url}
              secondaryImageUrl={product.product_images?.[1]?.image_url}
              categoryName={product.categories?.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// 04. Editorial / Lifestyle Story
function EditorialStory() {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            <span className="mb-6 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-foreground/60">
              The Edit
            </span>
            <h2 className="mb-8 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Elevating the <br /> Everyday
            </h2>
            <p className="mb-10 max-w-md text-base leading-relaxed text-foreground/70 md:text-lg">
              We believe in the power of restraint. Our pieces are meticulously crafted to transcend seasons, offering a foundation of quiet luxury that empowers you to express your inherent confidence.
            </p>
            <Link
              to="/shop"
              className="group inline-flex w-fit items-center gap-4 text-sm font-medium uppercase tracking-widest text-foreground transition-colors"
            >
              <span className="border-b border-foreground pb-0.5">Shop The Edit</span>
            </Link>
          </div>
          <div className="order-1 lg:order-2 aspect-[4/5] w-full overflow-hidden bg-[#f0eee9]">
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80" 
              alt="Editorial presentation" 
              className="h-full w-full object-cover" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// 05. Trust / Service
function TrustBar() {
  const features = [
    { title: "Complimentary Shipping", subtitle: "On all domestic orders over $200" },
    { title: "Thoughtful Returns", subtitle: "Extended 30-day return window" },
    { title: "Secure Checkout", subtitle: "Encrypted and protected transactions" },
  ];

  return (
    <section className="border-t border-border/60 py-24 bg-[#faf9f8]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-3 md:text-left">
          {features.map((feat, i) => (
            <div key={i} className="flex flex-col items-center justify-center md:items-start">
              <h4 className="mb-2 font-serif text-xl font-medium text-foreground">{feat.title}</h4>
              <p className="text-sm text-foreground/60">{feat.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- MAIN PAGE ---

function Index() {
  const { data: newArrivals = [] } = useQuery({
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

  const { data: trendingProducts = [] } = useQuery({
    queryKey: ["products-trending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, categories(name), product_images(image_url, display_order)`)
        .order("price", { ascending: false }) 
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
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 pb-0">
        
        <Hero />
        <ShopByCategories />
        <ProductGrid title="New Arrivals" products={newArrivals} viewAllLink="/shop" />
        <EditorialStory />
        <ProductGrid title="Trending Now" products={trendingProducts} viewAllLink="/shop" />
        <TrustBar />

      </main>
      <SiteFooter />
    </div>
  );
}

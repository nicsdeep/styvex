import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ui/product-card";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: wishlistedProducts, isLoading: dataLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch wishlist entries, then join with products
      const { data, error } = await supabase
        .from("wishlists")
        .select(`
          product_id,
          products (
            id,
            name,
            slug,
            price,
            is_featured,
            product_images (
              image_url
            )
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      
      return data
        .map((w) => w.products)
        .filter((p): p is NonNullable<typeof p> => p !== null);
    },
    enabled: !!user,
  });

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="mb-12 text-3xl font-light uppercase tracking-widest text-foreground text-center">My Wishlist</h1>

          {!user ? (
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">You must be signed in to view your wishlist.</p>
              <Link to="/account" className="inline-block bg-foreground px-8 py-3 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90">
                Sign In
              </Link>
            </div>
          ) : wishlistedProducts?.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">Your wishlist is currently empty.</p>
              <Link to="/shop" className="inline-block bg-foreground px-8 py-3 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlistedProducts?.map((product: any) => {
                // Ensure image_url exists
                const images = product.product_images || [];
                const primaryImage = images[0]?.image_url || "https://placehold.co/400x500/eeeeee/999999?text=No+Image";
                const secondaryImage = images[1]?.image_url;

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    imageUrl={primaryImage}
                    slug={product.slug}
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

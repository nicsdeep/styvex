import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronLeft, Heart } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(name),
          product_images(image_url, display_order),
          product_variants(*)
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check wishlist status
  const { data: isWishlisted } = useQuery({
    queryKey: ["wishlist", product?.id, user?.id],
    queryFn: async () => {
      if (!user || !product) return false;
      const { count } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      return count ? count > 0 : false;
    },
    enabled: !!user && !!product,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (currentlyWishlisted: boolean) => {
      if (!user || !product) throw new Error("Not logged in");
      
      if (currentlyWishlisted) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: product.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", product?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist_items"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update wishlist");
    }
  });

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to add to wishlist");
      return;
    }
    toggleWishlistMutation.mutate(!!isWishlisted);
  };

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Derive unique colors and sizes from variants
  const colors = useMemo(() => {
    if (!product?.product_variants) return [];
    const uniqueColors = Array.from(new Set(product.product_variants.map((v: any) => v.color).filter(Boolean)));
    return uniqueColors as string[];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product?.product_variants) return [];
    let filteredVariants = product.product_variants;
    if (selectedColor) {
      filteredVariants = filteredVariants.filter((v: any) => v.color === selectedColor);
    }
    const uniqueSizes = Array.from(new Set(filteredVariants.map((v: any) => v.size).filter(Boolean)));
    return uniqueSizes as string[];
  }, [product, selectedColor]);

  // Determine current variant based on selections
  const currentVariant = useMemo(() => {
    if (!product?.product_variants) return null;
    return product.product_variants.find(
      (v: any) => (v.color === selectedColor || (!v.color && !selectedColor)) &&
                  (v.size === selectedSize || (!v.size && !selectedSize))
    );
  }, [product, selectedColor, selectedSize]);

  const handleAddToCart = () => {
    if (!product) return;

    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color.");
      return;
    }
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    if (!currentVariant) {
      toast.error("This combination is unavailable.");
      return;
    }
    if (currentVariant.inventory_quantity <= 0) {
      toast.error("Out of stock.");
      return;
    }

    addItem({
      id: currentVariant.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
      imageUrl: product.product_images?.[0]?.image_url,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      quantity: 1,
      inventory_quantity: currentVariant.inventory_quantity,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center flex-col">
          <h1 className="text-2xl font-light uppercase tracking-widest">Product Not Found</h1>
          <p className="mt-4 text-muted-foreground">The product you are looking for does not exist.</p>
          <Link to="/shop" className="mt-8 border-b border-foreground pb-1 text-sm uppercase tracking-widest hover:text-muted-foreground">
            Return to Shop
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const sortedImages = [...(product.product_images || [])].sort((a: any, b: any) => a.display_order - b.display_order);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-12">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Image Gallery */}
            <div className="flex flex-col md:flex-row-reverse border-b md:border-b-0 md:border-r border-border/50">
              
              {/* Main Image */}
              <div className="relative aspect-[3/4] md:aspect-auto md:h-[calc(100vh-4rem)] w-full bg-muted flex-1 sticky top-16 overflow-hidden">
                {sortedImages.length > 0 ? (
                  <img
                    src={sortedImages[activeImageIndex]?.image_url}
                    alt={`${product.name} view ${activeImageIndex + 1}`}
                    className="h-full w-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image available</div>
                )}
                
                {/* Wishlist Floating Button on Mobile */}
                <button 
                  onClick={handleWishlistToggle}
                  className="absolute top-4 right-4 md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border/50 text-foreground transition-all active:scale-95"
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-current text-red-500")} />
                </button>
              </div>

              {/* Thumbnails */}
              {sortedImages.length > 1 && (
                <div className="flex flex-row md:flex-col gap-4 p-4 md:p-6 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-32 sticky top-16 md:h-[calc(100vh-4rem)]">
                  {sortedImages.map((img: any, idx: number) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "relative aspect-[3/4] flex-shrink-0 w-20 md:w-full overflow-hidden border-2 transition-colors",
                        activeImageIndex === idx ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={img.image_url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col px-6 py-8 md:p-12 lg:p-24">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {product.categories?.name}
                </span>
                
                {/* Wishlist Button Desktop */}
                <button 
                  onClick={handleWishlistToggle}
                  className="hidden md:flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart className={cn("h-4 w-4", isWishlisted && "fill-current text-red-500")} />
                  {isWishlisted ? "Saved" : "Save"}
                </button>
              </div>
              
              <h1 className="mb-4 text-2xl md:text-3xl font-light uppercase tracking-widest text-foreground sm:text-4xl">
                {product.name}
              </h1>
              <div className="mb-8 text-lg md:text-xl font-medium">
                ${product.price.toFixed(2)}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-10 text-sm leading-relaxed text-muted-foreground max-w-prose">
                  {product.description}
                </div>
              )}

              <div className="mb-10 h-px w-full bg-border/50" />

              {/* Color Selection */}
              {colors.length > 0 && (
                <div className="mb-8">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider">
                    Color {selectedColor && <span className="font-normal text-muted-foreground ml-2">{selectedColor}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedColor(c);
                          setSelectedSize(null); // Reset size when color changes
                        }}
                        className={cn(
                          "min-w-12 md:min-w-16 border px-4 py-2.5 text-xs font-medium transition-colors hover:border-foreground",
                          selectedColor === c ? "border-foreground bg-foreground text-background" : "border-border bg-transparent text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div className="mb-10">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                    <span>Size {selectedSize && <span className="font-normal text-muted-foreground ml-2">{selectedSize}</span>}</span>
                    <button className="text-muted-foreground font-normal hover:text-foreground underline underline-offset-4 decoration-border">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((s) => {
                      // Check if size is available in current color
                      let isAvailable = true;
                      if (selectedColor) {
                        const variant = product.product_variants.find((v: any) => v.color === selectedColor && v.size === s);
                        if (!variant || variant.inventory_quantity <= 0) {
                          isAvailable = false;
                        }
                      }

                      return (
                        <button
                          key={s}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSize(s)}
                          className={cn(
                            "min-w-12 border px-4 py-2.5 text-xs font-medium transition-colors",
                            !isAvailable ? "opacity-30 cursor-not-allowed border-border relative after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-full after:h-px after:bg-border after:-rotate-45" : "hover:border-foreground",
                            selectedSize === s && isAvailable ? "border-foreground bg-foreground text-background" : "border-border bg-transparent text-foreground"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-transform active:scale-[0.98] hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                disabled={
                  (colors.length > 0 && !selectedColor) || 
                  (sizes.length > 0 && !selectedSize) || 
                  (currentVariant && currentVariant.inventory_quantity <= 0)
                }
              >
                {currentVariant && currentVariant.inventory_quantity <= 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              {/* Shipping/Returns Info */}
              <div className="mt-12 space-y-4 text-xs text-muted-foreground border-t border-border/50 pt-8">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground" />
                  <p>Complimentary shipping and returns on all orders over $200.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground" />
                  <p>Estimated delivery within 3-5 business days.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();

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

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Derive unique colors and sizes from variants
  const colors = useMemo(() => {
    if (!product?.product_variants) return [];
    const uniqueColors = Array.from(new Set(product.product_variants.map((v: any) => v.color).filter(Boolean)));
    return uniqueColors as string[];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product?.product_variants) return [];
    // If color is selected, only show sizes available for that color
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
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Sort images by display_order
  const sortedImages = [...(product.product_images || [])].sort((a: any, b: any) => a.display_order - b.display_order);
  const mainImage = sortedImages[0]?.image_url;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Image Gallery */}
            <div className="flex flex-col border-r border-border/50">
              <div className="aspect-[3/4] md:aspect-auto md:h-[calc(100vh-4rem)] w-full sticky top-16 bg-muted">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image available</div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col px-6 py-12 md:p-16 lg:p-24">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {product.categories?.name}
              </div>
              <h1 className="mb-4 text-3xl font-light uppercase tracking-widest text-foreground sm:text-4xl">
                {product.name}
              </h1>
              <div className="mb-8 text-xl font-medium">
                ${product.price.toFixed(2)}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-10 text-sm leading-relaxed text-muted-foreground">
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
                          "min-w-16 border px-4 py-2 text-xs font-medium transition-colors hover:border-foreground",
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
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider">
                    Size {selectedSize && <span className="font-normal text-muted-foreground ml-2">{selectedSize}</span>}
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
                            "min-w-12 border px-4 py-2 text-xs font-medium transition-colors",
                            !isAvailable ? "opacity-30 cursor-not-allowed border-border" : "hover:border-foreground",
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
                className="w-full bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (colors.length > 0 && !selectedColor) || 
                  (sizes.length > 0 && !selectedSize) || 
                  (currentVariant && currentVariant.inventory_quantity <= 0)
                }
              >
                {currentVariant && currentVariant.inventory_quantity <= 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              {/* Shipping/Returns Info */}
              <div className="mt-12 space-y-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  Complimentary shipping and returns on all orders.
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  Estimated delivery within 3-5 business days.
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

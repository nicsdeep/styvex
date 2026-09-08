import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

import { ProductCard } from "@/components/ui/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params: { slug } }) => {
    const { data } = await supabase
      .from("products")
      .select("name, description, product_images(image_url)")
      .eq("slug", slug)
      .maybeSingle();
    return { productMeta: data };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.productMeta;
    if (!product) return {};
    return {
      meta: [
        { title: `${product.name} | STYVEX` },
        { name: "description", content: product.description || "STYVEX Product" },
        { property: "og:title", content: product.name },
        { property: "og:description", content: product.description || "" },
        { property: "og:image", content: product.product_images?.[0]?.image_url || "" }
      ]
    };
  },
  component: ProductPage,
});

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error: productError } = await supabase
        .from("products")
        .select(
          "*, categories(name, slug), product_images(id, image_url, display_order), product_variants(*)",
        )
        .eq("slug", slug)
        .single();
      if (productError) throw productError;
      return data;
    },
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.id, product?.category_id],
    queryFn: async () => {
      if (!product) return [];
      let request = supabase
        .from("products")
        .select(
          "*, categories(name), product_images(image_url, display_order), product_variants(id, color, size, inventory_quantity)",
        )
        .neq("id", product.id)
        .limit(8);
      if (product.category_id) request = request.eq("category_id", product.category_id);
      const { data, error: relatedError } = await request;
      if (relatedError) throw relatedError;
      return (data || []).map((item) => ({
        ...item,
        product_images: [...(item.product_images || [])].sort(
          (a, b) => a.display_order - b.display_order,
        ),
      }));
    },
    enabled: !!product,
  });

  const { data: isWishlisted } = useQuery({
    queryKey: ["wishlist", product?.id, user?.id],
    queryFn: async () => {
      if (!user || !product) return false;
      const { count } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      return (count || 0) > 0;
    },
    enabled: !!user && !!product,
  });

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("Sign in to save this item.");
      const request = isWishlisted
        ? supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id)
        : supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
      const { error: wishlistError } = await request;
      if (wishlistError) throw wishlistError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", product?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-ids", user?.id] });
      toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
    },
    onError: (wishlistError: Error) => toast.error(wishlistError.message),
  });

  const variants = useMemo(() => product?.product_variants || [], [product]);
  const inStockVariants = useMemo(
    () => variants.filter((variant) => variant.inventory_quantity > 0),
    [variants],
  );
  const allColors = useMemo(
    () => [...new Set(inStockVariants.map((variant) => variant.color).filter(Boolean))] as string[],
    [inStockVariants],
  );
  const allSizes = useMemo(
    () => [...new Set(inStockVariants.map((variant) => variant.size).filter(Boolean))] as string[],
    [inStockVariants],
  );

  const availableColors = useMemo(() => {
    if (!selectedSize) return allColors;
    return [
      ...new Set(
        inStockVariants
          .filter((variant) => variant.size === selectedSize)
          .map((variant) => variant.color)
          .filter(Boolean),
      ),
    ] as string[];
  }, [allColors, inStockVariants, selectedSize]);

  const availableSizes = useMemo(() => {
    if (!selectedColor) return allSizes;
    return [
      ...new Set(
        inStockVariants
          .filter((variant) => variant.color === selectedColor)
          .map((variant) => variant.size)
          .filter(Boolean),
      ),
    ] as string[];
  }, [allSizes, inStockVariants, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find(
        (variant) =>
          (!variant.color || variant.color === selectedColor) &&
          (!variant.size || variant.size === selectedSize),
      ) || null
    );
  }, [selectedColor, selectedSize, variants]);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    const first = inStockVariants[0];
    setSelectedColor(first?.color || null);
    setSelectedSize(first?.size || null);
  }, [product?.id, inStockVariants]);

  const sortedImages = useMemo(
    () => [...(product?.product_images || [])].sort((a, b) => a.display_order - b.display_order),
    [product],
  );

  const handleAddToCart = () => {
    if (!product) return;
    if (allColors.length > 0 && !selectedColor) {
      toast.error("Choose a color first.");
      return;
    }
    if (allSizes.length > 0 && !selectedSize) {
      toast.error("Choose a size first.");
      return;
    }
    if (
      variants.length > 0 &&
      (!selectedVariant || selectedVariant.inventory_quantity < quantity)
    ) {
      toast.error("That option is currently unavailable.");
      return;
    }
    addItem({
      id: selectedVariant?.id || product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
      imageUrl: sortedImages[0]?.image_url || "",
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
      quantity,
      inventory_quantity: selectedVariant?.inventory_quantity || 99,
    });
  };

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      await navigator
        .share({ title: product.name, url: window.location.href })
        .catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-brand" />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-4xl font-semibold">This item could not be found</h1>
          <p className="mt-3 text-muted-foreground">It may have moved or is no longer available.</p>
          <Link
            to="/shop"
            className="mt-7 rounded-lg bg-ink px-7 py-3 text-xs font-bold uppercase tracking-widest text-white"
          >
            Browse the shop
          </Link>
        </main>
      </div>
    );
  }

  const compareAtPrice = Math.round(product.price * 1.2 * 100) / 100;
  const discount = Math.round((1 - product.price / compareAtPrice) * 100);
  const totalInventory = inStockVariants.reduce(
    (sum, variant) => sum + variant.inventory_quantity,
    0,
  );
  const sku = selectedVariant?.sku || `STX-${product.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfb]">
      <SiteHeader />
      <main className="flex-1 pb-24 pt-[4.5rem] sm:pt-[6.5rem] lg:pb-0">
        <div className="border-b border-border/60 bg-ink text-white">
          <div className="mx-auto flex max-w-[1540px] items-center justify-center gap-7 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.14em] sm:text-xs">
            <span className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-brand-soft" /> Free shipping over $50
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <RotateCcw className="h-3.5 w-3.5 text-brand-soft" /> 30-day returns
            </span>
            <span className="hidden items-center gap-2 md:flex">
              <LockKeyhole className="h-3.5 w-3.5 text-brand-soft" /> Secure checkout
            </span>
          </div>
        </div>

        <nav
          className="mx-auto flex max-w-[1540px] items-center gap-1.5 overflow-hidden px-5 py-4 text-xs text-muted-foreground md:px-10 lg:px-14"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="shrink-0 hover:text-brand">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/shop" className="shrink-0 hover:text-brand">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {product.categories?.slug && (
            <>
              <Link
                to="/category/$slug"
                params={{ slug: product.categories.slug }}
                className="shrink-0 hover:text-brand"
              >
                {product.categories.name}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          )}
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <section className="mx-auto grid max-w-[1540px] gap-8 px-5 pb-12 md:px-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(380px,.75fr)] lg:gap-12 lg:px-14 lg:pb-16">
          <div className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
              {sortedImages.length > 1 && (
                <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
                  {sortedImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setActiveImageIndex(index)}
                      className={cn(
                        "aspect-square w-[68px] shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition",
                        activeImageIndex === index
                          ? "border-brand"
                          : "border-transparent hover:border-border",
                      )}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image.image_url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div
                className={cn(
                  "relative order-1 overflow-hidden rounded-2xl bg-[#f4f1ed] sm:order-2",
                  sortedImages.length > 1 ? "" : "sm:col-span-2",
                )}
              >
                <div className="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]">
                  {sortedImages[activeImageIndex] ? (
                    <img
                      src={sortedImages[activeImageIndex].image_url}
                      alt={product.name}
                      className="h-full w-full cursor-zoom-in object-cover transition duration-500 hover:scale-[1.025]"
                      onClick={() => setIsImageZoomed(true)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-bold uppercase tracking-[.25em] text-muted-foreground/45">
                      Styvex
                    </div>
                  )}
                </div>
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-md bg-brand px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Save {discount}%
                  </span>
                  {product.is_featured && (
                    <span className="rounded-md bg-ink px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      Bestseller
                    </span>
                  )}
                </div>
                {sortedImages.length > 0 && (
                  <button
                    onClick={() => setIsImageZoomed(true)}
                    className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow backdrop-blur"
                    aria-label="Zoom product image"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {sortedImages.length > 1 && (
              <div className="mt-3 text-center text-xs text-muted-foreground">
                Image {activeImageIndex + 1} of {sortedImages.length}
              </div>
            )}
          </div>

          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-[0_24px_60px_-38px_rgba(32,20,18,.5)] sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand">
                    {product.categories?.name || "The Styvex edit"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">SKU {sku}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-brand hover:text-brand"
                    aria-label="Share product"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleWishlist.mutate()}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-brand hover:text-brand"
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={cn("h-4 w-4", isWishlisted && "fill-brand text-brand")} />
                  </button>
                </div>
              </div>

              <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.08] tracking-[-.035em] text-ink sm:text-4xl">
                {product.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex text-amber-500" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold">New arrival</span>
                <span className="text-muted-foreground">·</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Quality checked
                </span>
              </div>

              <div className="mt-5 flex items-end gap-3 border-b border-border/60 pb-6">
                <span className="text-3xl font-extrabold tracking-tight text-ink">
                  {formatPrice(product.price)}
                </span>
                <span className="pb-1 text-sm text-muted-foreground line-through">
                  {formatPrice(compareAtPrice)}
                </span>
              </div>

              {allColors.length > 0 && (
                <fieldset className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <legend className="text-sm font-bold">
                      Color{" "}
                      <span className="font-normal text-muted-foreground">
                        {selectedColor && `— ${selectedColor}`}
                      </span>
                    </legend>
                    <span className="text-xs text-muted-foreground">
                      {availableColors.length} available
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map((color) => {
                      const available = availableColors.includes(color);
                      return (
                        <button
                          type="button"
                          key={color}
                          disabled={!available}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "rounded-lg border px-3.5 py-2 text-xs font-semibold transition",
                            selectedColor === color
                              ? "border-ink bg-ink text-white"
                              : "border-border bg-white hover:border-brand",
                            !available && "cursor-not-allowed opacity-35 line-through",
                          )}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {allSizes.length > 0 && (
                <fieldset className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <legend className="text-sm font-bold">
                      Size{" "}
                      <span className="font-normal text-muted-foreground">
                        {selectedSize && `— ${selectedSize}`}
                      </span>
                    </legend>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-bold text-brand"
                    >
                      <Ruler className="h-3.5 w-3.5" /> Size guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => {
                      const available = availableSizes.includes(size);
                      return (
                        <button
                          type="button"
                          key={size}
                          disabled={!available}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "min-w-11 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                            selectedSize === size
                              ? "border-ink bg-ink text-white"
                              : "border-border bg-white hover:border-brand",
                            !available && "cursor-not-allowed opacity-35 line-through",
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="mt-7 flex gap-3">
                <div className="flex h-12 shrink-0 items-center rounded-lg border border-border bg-white">
                  <button
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex h-full w-10 items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((value) =>
                        Math.min(selectedVariant?.inventory_quantity || 99, value + 1),
                      )
                    }
                    className="flex h-full w-10 items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={
                    variants.length > 0 &&
                    (!selectedVariant || selectedVariant.inventory_quantity === 0)
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-xs font-extrabold uppercase tracking-[.14em] text-white transition hover:bg-ink active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <PackageCheck className="h-4 w-4 text-emerald-700" />{" "}
                {totalInventory > 0
                  ? `${totalInventory} total units available`
                  : variants.length
                    ? "Currently unavailable"
                    : "Ready to order"}
              </div>

              <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-xl bg-muted/55 px-2 py-4 text-center">
                <div className="px-2">
                  <Truck className="mx-auto h-4 w-4 text-brand" />
                  <p className="mt-1.5 text-[10px] font-bold uppercase">Tracked delivery</p>
                </div>
                <div className="px-2">
                  <RotateCcw className="mx-auto h-4 w-4 text-brand" />
                  <p className="mt-1.5 text-[10px] font-bold uppercase">Easy returns</p>
                </div>
                <div className="px-2">
                  <ShieldCheck className="mx-auto h-4 w-4 text-brand" />
                  <p className="mt-1.5 text-[10px] font-bold uppercase">Buyer protection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-white">
          <div className="mx-auto grid max-w-[1540px] gap-10 px-5 py-12 md:px-10 lg:grid-cols-[1.3fr_.7fr] lg:px-14 lg:py-16">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand">
                The details
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                Everything to know
              </h2>
              <div className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
                {product.description ? (
                  product.description
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p>
                    A considered addition to your everyday edit, selected for its versatile styling
                    and reliable finish.
                  </p>
                )}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4">
                  <Sparkles className="h-5 w-5 text-brand" />
                  <p className="mt-3 text-sm font-bold">Curated style</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Selected to mix easily with the pieces you already own.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <Box className="h-5 w-5 text-brand" />
                  <p className="mt-3 text-sm font-bold">Careful packing</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Prepared and tracked from dispatch to delivery.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                  <p className="mt-3 text-sm font-bold">Shop confidently</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Secure checkout and responsive order support.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-[.14em]">
                Product information
              </h3>
              <dl className="divide-y divide-border/60 rounded-xl border border-border/60 bg-[#fffdfb] px-5 text-sm">
                <div className="flex justify-between gap-4 py-4">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-semibold text-right">
                    {product.categories?.name || "Lifestyle"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-4">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-semibold text-right">{sku}</dd>
                </div>
                <div className="flex justify-between gap-4 py-4">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd className="font-semibold text-emerald-700">In stock</dd>
                </div>
                <div className="flex justify-between gap-4 py-4">
                  <dt className="text-muted-foreground">Returns</dt>
                  <dd className="font-semibold">Within 30 days</dd>
                </div>
              </dl>
              <details className="group rounded-xl border border-border/60 bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                  Shipping & delivery <Plus className="h-4 w-4 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  Delivery timing and final cost are calculated at checkout. Tracking is provided
                  when your order dispatches.
                </p>
              </details>
              <details className="group rounded-xl border border-border/60 bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                  Returns & support <Plus className="h-4 w-4 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  Request a return within 30 days of delivery. Contact Styvex support if you need
                  help with sizing, delivery, or your order.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1540px] px-5 py-14 md:px-10 lg:px-14 lg:py-20">
          <div className="mb-7 flex items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand">
                Keep exploring
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                You may also like
              </h2>
            </div>
            {product.categories?.slug ? (
              <Link
                to="/category/$slug"
                params={{ slug: product.categories.slug }}
                className="hidden items-center gap-2 text-sm font-bold hover:text-brand sm:flex"
              >
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/shop"
                className="hidden items-center gap-2 text-sm font-bold hover:text-brand sm:flex"
              >
                View more <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item, index) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  compareAtPrice={Math.round(item.price * 1.2 * 100) / 100}
                  slug={item.slug}
                  imageUrl={item.product_images?.[0]?.image_url}
                  secondaryImageUrl={item.product_images?.[1]?.image_url}
                  categoryName={item.categories?.name}
                  description={item.description}
                  variants={item.product_variants}
                  badges={index === 0 ? ["Recommended"] : []}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              More products from this collection are coming soon.
            </div>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-12px_35px_-24px_rgba(0,0,0,.4)] backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{product.name}</p>
          <p className="text-base font-extrabold">{formatPrice(product.price)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-xs font-extrabold uppercase tracking-wider text-white"
        >
          <ShoppingBag className="h-4 w-4" /> Add
        </button>
      </div>

      {isImageZoomed && sortedImages[activeImageIndex] && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded product image"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            onClick={() => setIsImageZoomed(false)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>
          {activeImageIndex > 0 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageIndex((index) => index - 1);
              }}
              className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <img
            src={sortedImages[activeImageIndex].image_url}
            alt={`${product.name}, view ${activeImageIndex + 1}`}
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          {activeImageIndex < sortedImages.length - 1 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageIndex((index) => index + 1);
              }}
              className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

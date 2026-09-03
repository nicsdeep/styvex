import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronLeft, Heart, Minus, Plus, Star, ShieldCheck, Truck, ChevronRight, ZoomIn, X } from "lucide-react";

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
          categories(name, slug),
          product_images(image_url, display_order),
          product_variants(*)
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch categories for sidebar
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data || [];
    }
  });

  // Fetch recommended products
  const { data: recommended } = useQuery({
    queryKey: ["recommended", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase
        .from("products")
        .select("*, product_images(image_url)")
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4);
      return data || [];
    },
    enabled: !!product?.category_id
  });

  const { data: categoryProducts = [] } = useQuery({
    queryKey: ["product-pagination", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, slug")
        .eq("category_id", product.category_id)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!product?.category_id,
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
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [imageTilt, setImageTilt] = useState({ x: 0, y: 0 });
  const [shippingOrigin, setShippingOrigin] = useState<"china" | "us">("china");
  const [sizeInput, setSizeInput] = useState("");
  const [fitMessage, setFitMessage] = useState("");

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedColor(null);
    setSelectedSize(null);
    setSizeInput("");
    setFitMessage("");
  }, [slug]);

  // Derive unique colors and sizes from variants
  const colors = useMemo(() => {
    if (!product?.product_variants) return [];
    const matchingVariants = selectedSize
      ? product.product_variants.filter((v: any) => v.size === selectedSize && v.inventory_quantity > 0)
      : product.product_variants.filter((v: any) => v.inventory_quantity > 0);
    const uniqueColors = Array.from(new Set(matchingVariants.map((v: any) => v.color).filter(Boolean)));
    return uniqueColors as string[];
  }, [product, selectedSize]);

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
    if (currentVariant.inventory_quantity < quantity) {
      toast.error(`Only ${currentVariant.inventory_quantity} available.`);
      return;
    }

    addItem({
      id: currentVariant.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
      imageUrl: product.product_images?.[0]?.image_url || "",
      size: selectedSize || "",
      color: selectedColor || "",
      quantity: quantity,
      inventory_quantity: currentVariant.inventory_quantity,
    });
    
    toast.success("Added to cart");
  };
  
  // Dummy data generation based on product ID to make it look active
  const dummyData = useMemo(() => {
    if (!product) return null;
    const hash = product.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return {
      sku: `STX${Math.abs(hash % 1000000).toString().padStart(6, '0')}`,
      lists: Math.abs(hash % 200) + 15,
      weight: (Math.abs(hash % 1000) + 100) + "g",
      shippingEstimate: "$" + ((Math.abs(hash % 1000) / 100) + 2).toFixed(2),
      shippingCostNum: ((Math.abs(hash % 1000) / 100) + 2)
    };
  }, [product]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
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
          <h1 className="text-2xl font-bold uppercase tracking-widest">Product Not Found</h1>
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
  const currentProductIndex = categoryProducts.findIndex((item) => item.id === product.id);
  const previousProduct = currentProductIndex > 0 ? categoryProducts[currentProductIndex - 1] : null;
  const nextProduct = currentProductIndex >= 0 && currentProductIndex < categoryProducts.length - 1 ? categoryProducts[currentProductIndex + 1] : null;
  const deliveryDetails = shippingOrigin === "us"
    ? { label: "US Warehouse", delivery: "4–7 days", cost: 6.95 }
    : { label: "China Warehouse", delivery: "7–15 days", cost: dummyData?.shippingCostNum || 0 };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="pt-[4.5rem] sm:pt-[6.5rem]">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <Link to="/shop" className="hover:text-primary">Shop</Link>
          {product.categories?.name && (
            <>
              <ChevronRight className="w-3 h-3 mx-2" />
              <Link to="/shop" search={{ category: product.categories.slug } as any} className="hover:text-primary">
                {product.categories.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </div>
      </div>

      {(previousProduct || nextProduct) && (
        <div className="border-b border-border/40 bg-background">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 text-sm">
            {previousProduct ? (
              <Link to="/product/$slug" params={{ slug: previousProduct.slug }} className="group flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-brand">
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Previous: {previousProduct.name}</span>
              </Link>
            ) : <span />}
            {nextProduct ? (
              <Link to="/product/$slug" params={{ slug: nextProduct.slug }} className="group flex min-w-0 items-center gap-2 text-right text-muted-foreground transition-colors hover:text-brand">
                <span className="truncate">Next: {nextProduct.name}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : <span />}
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1400px] flex flex-col lg:flex-row gap-6">
          
          {/* Dynamic Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 hidden lg:block">
            {/* Categories Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-border/40 p-5">
              <h3 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm border-b border-border/40 pb-2">Categories</h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">
                    <span>All Products</span>
                  </Link>
                </li>
                {categories?.map((category: any) => (
                  <li key={category.id}>
                    <Link 
                      to="/shop" 
                      search={{ category: category.slug } as any}
                      className={cn(
                        "transition-colors flex items-center justify-between",
                        product?.category_id === category.id ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      <span>{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Products Widget */}
            {recommended && recommended.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-border/40 p-5">
                <h3 className="font-semibold text-foreground mb-4 uppercase tracking-wider text-sm border-b border-border/40 pb-2">You May Also Like</h3>
                <div className="space-y-4">
                  {recommended.map((rec: any) => (
                    <Link key={rec.id} to="/product/$slug" params={{ slug: rec.slug }} className="flex gap-3 group">
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                        {rec.product_images?.[0]?.image_url ? (
                          <img src={rec.product_images[0].image_url} alt={rec.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{rec.name}</span>
                        <span className="text-sm font-bold mt-1">${rec.price.toFixed(2)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Product Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-border/40 overflow-hidden mb-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
                
                {/* Left Column: Image Gallery (Takes 5 columns) */}
                <div className="xl:col-span-5 p-4 md:p-6 flex flex-col md:flex-row gap-4 border-b xl:border-b-0 xl:border-r border-border/40">
                  
                  {/* Thumbnails (Vertical on desktop) */}
                  {sortedImages.length > 1 && (
                    <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar order-2 md:order-1 md:w-20 flex-shrink-0">
                      {sortedImages.map((img: any, idx: number) => (
                        <button
                          key={img.id}
                          onClick={() => setActiveImageIndex(idx)}
                          className={cn(
                            "relative aspect-square w-16 md:w-full overflow-hidden rounded-md border-2 transition-colors",
                            activeImageIndex === idx ? "border-primary" : "border-transparent hover:border-primary/50"
                          )}
                        >
                          <img src={img.image_url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Image */}
                  <div
                    className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted order-1 md:order-2 flex-1"
                    onMouseMove={(event) => {
                      const bounds = event.currentTarget.getBoundingClientRect();
                      setImageTilt({
                        x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 4,
                        y: ((event.clientY - bounds.top) / bounds.height - 0.5) * -4,
                      });
                    }}
                    onMouseLeave={() => setImageTilt({ x: 0, y: 0 })}
                  >
                    {sortedImages.length > 0 ? (
                      <img
                        src={sortedImages[activeImageIndex]?.image_url}
                        alt={product.name}
                        onClick={() => setIsImageZoomed(true)}
                        className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 ease-out"
                        style={{ transform: `perspective(1000px) rotateX(${imageTilt.y}deg) rotateY(${imageTilt.x}deg) scale(1.025)` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground bg-gray-100">No image</div>
                    )}
                    
                    {/* Share/Favorite Floating */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button 
                        onClick={handleWishlistToggle}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow text-foreground hover:bg-white"
                        title="Save to List"
                      >
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
                      </button>
                    </div>
                    {sortedImages.length > 0 && (
                      <button
                        onClick={() => setIsImageZoomed(true)}
                        className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-ink/85 px-3 py-2 text-xs font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-ink"
                      >
                        <ZoomIn className="h-3.5 w-3.5" /> Zoom image
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Product Info & Purchase (Takes 7 columns) */}
                <div className="xl:col-span-7 p-4 md:p-8 flex flex-col">
                  
                  {/* Badges / Top Info */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className="rounded bg-brand/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-brand">
                      Styvex edit
                    </span>
                    {dummyData && (
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Star className="mr-1 h-3 w-3 fill-brand text-brand" />
                        Carefully selected
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2 leading-tight">
                    {product.name}
                  </h1>
                  
                  {/* Meta info */}
                  {dummyData && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 pb-4 border-b border-border/40">
                      <span>SKU: {dummyData.sku}</span>
                      <span>Weight: {dummyData.weight}</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-foreground">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Product Price</div>
                  </div>

                  {/* Shipping From Selector (Static visual for CJ vibe) */}
                  <div className="mb-6 flex items-start gap-4">
                    <div className="w-24 text-sm text-muted-foreground pt-1.5">Shipping From</div>
                    <div className="flex gap-2">
                      <button onClick={() => setShippingOrigin("china")} className={cn("relative rounded border px-4 py-1.5 text-sm font-medium transition-colors", shippingOrigin === "china" ? "border-2 border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-foreground/30")}>
                        China Warehouse
                        {shippingOrigin === "china" && <div className="absolute -bottom-1 -right-1 h-0 w-0 border-b-[8px] border-l-[8px] border-b-primary border-l-transparent" />}
                      </button>
                      <button onClick={() => setShippingOrigin("us")} className={cn("relative rounded border px-4 py-1.5 text-sm font-medium transition-colors", shippingOrigin === "us" ? "border-2 border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-foreground/30")}>
                        US Warehouse
                        {shippingOrigin === "us" && <div className="absolute -bottom-1 -right-1 h-0 w-0 border-b-[8px] border-l-[8px] border-b-primary border-l-transparent" />}
                      </button>
                    </div>
                  </div>

                  {sizes.length > 0 && (
                    <div className="mb-6 flex items-start gap-4">
                      <div className="w-24 text-sm text-muted-foreground pt-1.5">Size</div>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex max-w-sm gap-2">
                          <input
                            value={sizeInput}
                            onChange={(event) => setSizeInput(event.target.value)}
                            placeholder="Enter your usual size"
                            className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
                          />
                          <button
                            onClick={() => {
                              const matchingSize = sizes.find((size) => size.toLowerCase() === sizeInput.trim().toLowerCase());
                              if (matchingSize) {
                                setSelectedSize(matchingSize);
                                setSelectedColor(null);
                                setFitMessage(`Showing colors available in ${matchingSize}.`);
                              } else {
                                setFitMessage(`Available sizes: ${sizes.join(", ")}.`);
                              }
                            }}
                            className="rounded bg-ink px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand"
                          >
                            Find fit
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                        {sizes.map((s) => {
                          let isAvailable = true;
                          if (selectedColor) {
                            const variant = product.product_variants.find((v: any) => v.color === selectedColor && v.size === s);
                            if (!variant || variant.inventory_quantity <= 0) isAvailable = false;
                          }
                          return (
                            <button
                              key={s}
                              disabled={!isAvailable}
                              onClick={() => {
                                setSelectedSize(s);
                                setSelectedColor(null);
                                setSizeInput(s);
                                setFitMessage(`Showing colors available in ${s}.`);
                              }}
                              className={cn(
                                "border min-w-[3rem] px-3 py-1.5 text-sm rounded transition-all",
                                !isAvailable ? "opacity-40 cursor-not-allowed bg-muted/50 line-through" :
                                selectedSize === s ? "border-primary text-primary bg-primary/5" : "border-border text-foreground hover:border-foreground/40"
                              )}
                            >
                              {s}
                            </button>
                          );
                        })}
                        </div>
                        {fitMessage && <p className="text-xs text-muted-foreground">{fitMessage}</p>}
                      </div>
                    </div>
                  )}

                  {colors.length > 0 && (
                    <div className="mb-6 flex items-start gap-4">
                      <div className="w-24 text-sm text-muted-foreground pt-1.5">Color</div>
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {colors.map((c) => (
                            <button
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              className={cn(
                                "rounded border px-3 py-1.5 text-sm transition-all",
                                selectedColor === c ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-foreground/40"
                              )}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{selectedSize ? `Colors in ${selectedSize}` : "Choose a size to see matching colors."}</p>
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-8 flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">Quantity</div>
                    <div className="flex items-center border border-border rounded h-9">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <div className="w-12 text-center text-sm font-medium border-x border-border h-full flex items-center justify-center">
                        {quantity}
                      </div>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {currentVariant && (
                      <span className="text-xs text-muted-foreground">
                        {currentVariant.inventory_quantity} pieces available
                      </span>
                    )}
                  </div>

                  {/* Shipping Calculation Box */}
                  <div className="bg-[#f8f9fa] rounded-lg p-4 mb-8 border border-border/40">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Shipping Method</div>
                        <div className="font-medium flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-primary" /> Standard Shipping
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Estimated Delivery</div>
                        <div className="font-medium">{deliveryDetails.delivery}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Shipping Cost</div>
                        <div className="font-medium text-orange-600">${deliveryDetails.cost.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Tracking</div>
                        <div className="font-medium flex items-center gap-1.5 text-green-600">
                          <ShieldCheck className="w-4 h-4" /> Available
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Cost & Action */}
                  <div className="mt-auto pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Price</div>
                      <div className="text-3xl font-bold text-foreground">
                        ${( (product.price * quantity) + deliveryDetails.cost ).toFixed(2)}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddToCart}
                      className="w-full sm:w-auto bg-primary px-10 py-4 rounded-lg text-sm font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={(sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor) || !!(currentVariant && currentVariant.inventory_quantity < quantity)}
                    >
                      Add to Cart
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Product details stay visible instead of being hidden behind tabs. */}
            <div className="bg-white rounded-xl shadow-sm border border-border/40 overflow-hidden mb-12">
              <div className="p-6 md:p-10">
                <div className="space-y-8 text-sm">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <h2 className="font-display text-2xl font-semibold text-foreground">Product details</h2>
                    <span className="text-xs text-muted-foreground">Everything you need before checkout</span>
                  </div>
                    {/* Attributes Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl">
                      <div className="flex border-b border-border/40 pb-2">
                        <span className="w-1/3 text-muted-foreground">Material</span>
                        <span className="w-2/3 font-medium">Cotton Blend, Polyester</span>
                      </div>
                      <div className="flex border-b border-border/40 pb-2">
                        <span className="w-1/3 text-muted-foreground">Package Size</span>
                        <span className="w-2/3 font-medium">300 x 200 x 50 mm</span>
                      </div>
                      <div className="flex border-b border-border/40 pb-2">
                        <span className="w-1/3 text-muted-foreground">Style</span>
                        <span className="w-2/3 font-medium">Casual, Modern</span>
                      </div>
                      <div className="flex border-b border-border/40 pb-2">
                        <span className="w-1/3 text-muted-foreground">Season</span>
                        <span className="w-2/3 font-medium">All Seasons</span>
                      </div>
                    </div>
                    
                    {/* Free text description */}
                    {product.description ? (
                      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed mt-8">
                        {product.description.split('\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-8">No detailed description provided for this product.</p>
                    )}
                    
                    {/* Show images in description */}
                    <div className="mt-12 space-y-4 flex flex-col items-center">
                      {sortedImages.map((img: any) => (
                        <img key={img.id} src={img.image_url} alt="Description graphic" className="max-w-full md:max-w-3xl rounded-lg" />
                      ))}
                    </div>
                  <div className="flex items-center gap-3 border-t border-border/40 pt-8 text-muted-foreground">
                    <Star className="h-5 w-5 text-brand" />
                    <p>Reviews will appear here once customers share their verified purchase feedback.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
      {isImageZoomed && sortedImages[activeImageIndex] && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded product image"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative flex h-full w-full max-w-5xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <img
              src={sortedImages[activeImageIndex].image_url}
              alt={`${product.name} expanded`}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-lg transition-transform hover:scale-105"
              aria-label="Close expanded image"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

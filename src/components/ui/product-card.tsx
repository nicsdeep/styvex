import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  imageUrl?: string | null | undefined;
  secondaryImageUrl?: string | null;
  categoryName?: string;
  slug: string;
  badges?: string[];
  isWishlisted?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  compareAtPrice,
  description,
  rating,
  reviewCount,
  imageUrl,
  secondaryImageUrl,
  categoryName,
  slug,
  badges = [],
  isWishlisted = false,
  className,
}: ProductCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  // Format price as currency
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(p);

  const { data: wishlistedProductIds = new Set<string>() } = useQuery({
    queryKey: ["wishlist-ids", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
      if (error) throw error;
      return new Set(data.map(d => d.product_id));
    },
    enabled: !!user,
  });

  const actuallyWishlisted = isWishlisted || wishlistedProductIds.has(id);
  const compactDescription = description?.replace(/product\s+sku\s*:/gi, "SKU:");

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (actuallyWishlisted) {
        const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: id });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      if (!user) {
        toast("Please sign in to save items to your wishlist.");
        throw new Error("Not authenticated");
      }
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["wishlist-ids", user.id] });
      const previous = queryClient.getQueryData<Set<string>>(["wishlist-ids", user.id]);
      
      const next = new Set(previous || []);
      if (actuallyWishlisted) {
        next.delete(id);
      } else {
        next.add(id);
      }
      queryClient.setQueryData(["wishlist-ids", user.id], next);
      
      return { previous };
    },
    onError: (err, newTodo, context) => {
      if (err.message !== "Not authenticated") {
        toast.error("Failed to update wishlist");
        if (user && context?.previous) {
          queryClient.setQueryData(["wishlist-ids", user.id], context.previous);
        }
      }
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["wishlist", user.id] });
      }
    }
  });

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id, // Default to product id for quick add
      productId: id,
      name,
      price,
      slug,
      quantity: 1,
      inventory_quantity: 10, // Assuming a default inventory for quick add
      ...(imageUrl ? { imageUrl } : {})
    });
    toast.success("Added to cart");
  };
  
  return (
    <div className={cn("group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-background transition-all duration-500 hover:-translate-y-1 hover:border-brand/30 luxury-shadow", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link to={`/product/${slug}` as any} className="absolute inset-0 z-0">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={name}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-700 ease-out",
                  secondaryImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105"
                )}
                loading="lazy"
              />
              {secondaryImageUrl && (
                <img
                  src={secondaryImageUrl}
                  alt={`${name} alternate view`}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-muted to-muted/30">
                <span className="rotate-[-15deg] text-xl font-bold uppercase tracking-widest text-muted-foreground/30">Styvex</span>
            </div>
          )}
        </Link>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-col gap-1.5 z-10 pointer-events-none">
            {badges.map((badge) => (
              <span
                key={badge}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider shadow-sm",
                  badge.includes("-") ? "bg-brand text-accent-foreground" : "bg-ink text-primary-foreground"
                )}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist.mutate();
          }}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-transform hover:scale-110 hover:text-brand backdrop-blur-sm"
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-3.5 w-3.5", actuallyWishlisted && "fill-brand text-brand")} />
        </button>
      </div>

      <div className="flex min-h-[112px] flex-1 flex-col p-3.5">
        {categoryName && <span className="eyebrow text-muted-foreground">{categoryName}</span>}
        <Link to={`/product/${slug}` as any} className="mt-1 min-h-[2.45em] text-[0.88rem] font-semibold leading-snug line-clamp-2 hover:text-brand" title={name}>
          {name}
        </Link>
        <p className="mt-1 min-h-[1.25rem] text-xs leading-5 text-muted-foreground line-clamp-1">
          {compactDescription || "A considered piece for the everyday edit."}
        </p>
        {rating && reviewCount ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label={`${rating} out of 5 from ${reviewCount} reviews`}>
            <Star className="h-3.5 w-3.5 fill-brand text-brand" />
            <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            <span>({reviewCount} reviews)</span>
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {compareAtPrice && compareAtPrice > price ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-brand">{formatPrice(price)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatPrice(compareAtPrice)}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-foreground">{formatPrice(price)}</span>
            )}
          </div>
          
          <button 
            onClick={handleQuickAdd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-primary-foreground transition-colors hover:bg-brand"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


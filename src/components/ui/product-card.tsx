import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Star, ShoppingCart } from "lucide-react";
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
  
  // A pseudo-random lists number based on product ID to make it look dynamic but consistent
  const listsCount = useMemo(() => {
    const hash = id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return Math.abs(hash % 100) + 12;
  }, [id]);

  return (
    <div className={cn("group relative flex flex-col bg-background rounded-lg border border-border/40 hover:border-border/80 transition-all hover:shadow-md", className)}>
      <div className="relative aspect-square overflow-hidden bg-muted rounded-t-lg">
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
              <span className="text-xl font-bold uppercase tracking-widest text-muted-foreground/30 rotate-[-15deg]">Styvex</span>
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
                  "px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider rounded-sm shadow-sm",
                  badge.includes("-") ? "bg-[#e55039] text-white" : "bg-foreground text-background"
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
          className="absolute right-2 top-2 flex h-7 w-7 z-10 items-center justify-center rounded-full bg-background/90 shadow-sm text-foreground transition-transform hover:scale-110 backdrop-blur-sm"
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-3.5 w-3.5", actuallyWishlisted && "fill-[#e55039] text-[#e55039]")} />
        </button>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <Link to={`/product/${slug}` as any} className="text-[0.8rem] leading-tight font-medium hover:text-primary line-clamp-2 min-h-[2.4em]" title={name}>
          {name}
        </Link>
        
        <div className="text-[0.7rem] text-muted-foreground mt-1 flex items-center justify-between">
           <span>Lists: {listsCount}</span>
           <div className="flex text-[#ffb142]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-current" />
              ))}
            </div>
        </div>
        
        <div className="flex justify-between items-end mt-1">
          <div className="flex flex-col">
            {compareAtPrice && compareAtPrice > price ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#e55039] text-sm">{formatPrice(price)}</span>
                <span className="text-muted-foreground line-through text-[0.7rem]">{formatPrice(compareAtPrice)}</span>
              </div>
            ) : (
              <span className="font-bold text-sm text-foreground">{formatPrice(price)}</span>
            )}
          </div>
          
          <button 
            onClick={handleQuickAdd}
            className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


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

  return (
    <div className={cn("group relative flex flex-col bg-background", className)}>
      <div className="relative aspect-square overflow-hidden bg-muted rounded-xl">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className={cn(
                "h-full w-full object-cover transition-transform duration-700 ease-out",
                secondaryImageUrl ? "group-hover:opacity-0" : "group-hover:scale-110"
              )}
              loading="lazy"
            />
            {secondaryImageUrl && (
              <img
                src={secondaryImageUrl}
                alt={`${name} alternate view`}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-muted to-muted/30">
            <span className="text-2xl font-bold uppercase tracking-widest text-muted-foreground/30 rotate-[-15deg]">Styvex</span>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
            {badges.map((badge) => (
              <span
                key={badge}
                className={cn(
                  "px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-full shadow-sm",
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
          className="absolute right-3 top-3 flex h-8 w-8 z-10 items-center justify-center rounded-full bg-background shadow-sm text-foreground transition-transform hover:scale-110"
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", actuallyWishlisted && "fill-current text-[#e55039]")} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 pt-4 px-1 relative">
        {categoryName && (
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {categoryName}
          </p>
        )}
        
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1">
            <Link to={`/product/${slug}` as any} className="text-sm font-semibold leading-snug hover:underline line-clamp-1">
              {name}
            </Link>
            
            <div className="flex items-center gap-2 text-sm">
              {compareAtPrice && compareAtPrice > price ? (
                <>
                  <span className="font-bold text-[#e55039]">{formatPrice(price)}</span>
                  <span className="text-muted-foreground line-through text-xs">{formatPrice(compareAtPrice)}</span>
                </>
              ) : (
                <span className="font-bold">{formatPrice(price)}</span>
              )}
            </div>
            
            {/* Star Rating Placeholder */}
            <div className="flex items-center gap-1 mt-1">
              <div className="flex text-[#ffb142]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
              <span className="text-[0.65rem] text-muted-foreground">(128)</span>
            </div>
          </div>
          
          {/* Quick Add Button */}
          <button 
            onClick={handleQuickAdd}
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

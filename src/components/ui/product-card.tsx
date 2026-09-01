import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  return (
    <div className={cn("group relative flex flex-col bg-background", className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-500 ease-out",
                secondaryImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105"
              )}
              loading="lazy"
            />
            {secondaryImageUrl && (
              <img
                src={secondaryImageUrl}
                alt={`${name} alternate view`}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="bg-background px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-foreground"
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
          className="absolute right-3 top-3 flex h-8 w-8 z-10 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-all hover:bg-background hover:scale-110 group-hover:opacity-100"
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", actuallyWishlisted && "fill-current")} />
        </button>

        {/* Hover Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/20 to-transparent p-4 transition-transform duration-300 ease-out group-hover:translate-y-0">
          <button className="w-full bg-background px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background">
            Quick View
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-4">
        {categoryName && (
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {categoryName}
          </p>
        )}
        <div className="flex flex-col gap-1">
          <Link to={`/product/${slug}` as any} className="text-sm font-medium leading-snug hover:underline line-clamp-2">
            {name}
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {compareAtPrice && compareAtPrice > price ? (
              <>
                <span className="font-semibold text-destructive">{formatPrice(price)}</span>
                <span className="text-muted-foreground line-through">{formatPrice(compareAtPrice)}</span>
              </>
            ) : (
              <span className="font-semibold">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

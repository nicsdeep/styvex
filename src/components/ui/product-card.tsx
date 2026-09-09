import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ProductVariant = {
  id: string;
  color?: string | null;
  size?: string | null;
  inventory_quantity: number;
};

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  imageUrl?: string | null | undefined;
  secondaryImageUrl?: string | null | undefined;
  categoryName?: string | undefined;
  slug: string;
  badges?: string[];
  variants?: ProductVariant[] | null;
  isWishlisted?: boolean;
  className?: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

export function ProductCard({
  id,
  name,
  price,
  compareAtPrice,
  rating,
  reviewCount,
  imageUrl,
  secondaryImageUrl,
  categoryName,
  slug,
  badges = [],
  variants,
  isWishlisted = false,
  className,
}: ProductCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();

  const inStockVariants = (variants || []).filter((variant) => variant.inventory_quantity > 0);
  const colors = [
    ...new Set(inStockVariants.map((variant) => variant.color).filter(Boolean)),
  ] as string[];
  const sizes = [
    ...new Set(inStockVariants.map((variant) => variant.size).filter(Boolean)),
  ] as string[];
  const needsOptions = colors.length > 1 || sizes.length > 1;
  const quickVariant = inStockVariants[0];
  const soldOut = variants != null && variants.length > 0 && inStockVariants.length === 0;
  const discount =
    compareAtPrice && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : 0;

  const { data: wishlistedProductIds = new Set<string>() } = useQuery({
    queryKey: ["wishlist-ids", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return new Set(data.map((entry) => entry.product_id));
    },
    enabled: !!user,
  });

  const actuallyWishlisted = isWishlisted || wishlistedProductIds.has(id);

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (actuallyWishlisted) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: id });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      if (!user) {
        toast("Sign in to save items to your wishlist.");
        throw new Error("Not authenticated");
      }
      await queryClient.cancelQueries({ queryKey: ["wishlist-ids", user.id] });
      const previous = queryClient.getQueryData<Set<string>>(["wishlist-ids", user.id]);
      const next = new Set(previous || []);
      if (actuallyWishlisted) next.delete(id);
      else next.add(id);
      queryClient.setQueryData(["wishlist-ids", user.id], next);
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (error.message !== "Not authenticated") {
        toast.error("Failed to update wishlist");
        if (user && context?.previous)
          queryClient.setQueryData(["wishlist-ids", user.id], context.previous);
      }
    },
    onSettled: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ["wishlist", user.id] });
    },
  });

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (needsOptions || soldOut) return;
    addItem({
      id: quickVariant?.id || id,
      productId: id,
      name,
      price,
      slug,
      quantity: 1,
      inventory_quantity: quickVariant?.inventory_quantity || 99,
      ...(imageUrl ? { imageUrl } : {}),
      ...(quickVariant?.size ? { size: quickVariant.size } : {}),
      ...(quickVariant?.color ? { color: quickVariant.color } : {}),
    });
  };

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-md bg-white transition duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-white">
        <Link
          to="/product/$slug"
          params={{ slug }}
          className="absolute inset-0"
          aria-label={`View ${name}`}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={name}
                className={cn(
                  "h-full w-full object-cover transition duration-700",
                  secondaryImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105",
                )}
                loading="lazy"
              />
              {secondaryImageUrl && (
                <img
                  src={secondaryImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10 text-sm font-semibold tracking-[0.2em] text-muted-foreground/40">
              STYVEX
            </div>
          )}
        </Link>

        {/* Discount Badge Jumia Style */}
        {discount > 0 && (
          <div className="absolute right-2 top-2 z-10 rounded bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-brand shadow-sm">
            -{discount}%
          </div>
        )}

        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist.mutate();
          }}
          className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110 hover:text-brand"
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", actuallyWishlisted && "fill-brand text-brand")} />
        </button>
      </div>

      <Link
        to="/product/$slug"
        params={{ slug }}
        className="flex flex-1 flex-col p-2 sm:p-3"
        aria-label={`View details for ${name}`}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          {soldOut && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sold out
            </span>
          )}
        </div>

        <h3
          className="line-clamp-2 h-10 shrink-0 text-[13px] font-normal leading-5 text-ink/90 transition group-hover:text-brand"
          title={name}
        >
          {name}
        </h3>

        <div className="mt-auto pt-2 flex flex-col gap-0.5">
          <span className="text-base font-bold text-ink">
            {formatPrice(price)}
          </span>
          {compareAtPrice && compareAtPrice > price ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          ) : (
            <span className="text-xs text-transparent select-none">No discount</span>
          )}
        </div>
      </Link>
    </article>
  );
}

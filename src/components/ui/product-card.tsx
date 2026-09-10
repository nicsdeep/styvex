import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
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
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-black/[0.07] bg-white p-2 text-black transition-shadow duration-200 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] sm:p-3",
        className,
      )}
    >
      <div className="relative aspect-square shrink-0 overflow-hidden rounded-[18px] bg-neutral-50 sm:aspect-[4/3]">
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

        {(badges.length > 0 || discount > 0) && (
          <div className="absolute right-0 top-0 z-10 max-w-[85%] rounded-bl-2xl bg-black px-3 py-2 text-[10px] font-semibold capitalize text-white sm:text-xs">
            {badges[0]?.replace(/[-_]/g, " ") || `Save ${discount}%`}
          </div>
        )}

        {rating != null && rating > 0 && (reviewCount ?? 0) > 0 && <div className="absolute bottom-2 left-2 flex min-h-8 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold sm:text-sm">
            <><span>{rating.toFixed(1)}</span><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="sr-only">out of 5, {reviewCount} reviews</span></>
        </div>}

        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist.mutate();
          }}
          className="absolute right-2 bottom-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm transition hover:scale-105 hover:text-brand sm:h-11 sm:w-11"
          aria-pressed={actuallyWishlisted}
          disabled={toggleWishlist.isPending}
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", actuallyWishlisted && "fill-brand text-brand")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3 sm:pt-4">
        <Link to="/product/$slug" params={{ slug }}>
        <h3
          className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 tracking-tight transition group-hover:text-brand sm:min-h-12 sm:text-lg sm:leading-6"
          title={name}
        >
          {name}
        </h3>
        </Link>
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-600 sm:text-xs">Free shipping over $50 · Easy returns</p>
        {categoryName && <p className="mt-1 text-[10px] text-neutral-500">{categoryName}</p>}
        <div className="mt-auto flex flex-col gap-3 pt-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {compareAtPrice && compareAtPrice > price ? (
            <span className="text-[11px] text-neutral-400 line-through sm:text-xs">
              {formatPrice(compareAtPrice)}
            </span>
          ) : null}
          <span className="text-sm font-bold sm:text-base">{formatPrice(price)}</span>
          </div>
          {needsOptions && !soldOut ? (
            <Link to="/product/$slug" params={{ slug }} className="flex min-h-11 items-center justify-center rounded-full bg-black px-3 py-2 text-center text-[11px] font-semibold text-white transition hover:bg-neutral-800 sm:text-xs">Choose options</Link>
          ) : (
            <button type="button" onClick={handleQuickAdd} disabled={soldOut} className="min-h-11 rounded-full bg-black px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 sm:text-xs">{soldOut ? "Sold out" : "Add to Cart"}</button>
          )}
        </div>
      </div>
    </article>
  );
}

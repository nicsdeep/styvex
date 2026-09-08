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
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition duration-300 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-muted/30">
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

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-sm bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              Save {discount}%
            </span>
          )}
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-sm bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
            >
              {badge}
            </span>
          ))}
        </div>

        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist.mutate();
          }}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110 hover:text-brand"
          aria-label={actuallyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-3.5 w-3.5", actuallyWishlisted && "fill-brand text-brand")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            {categoryName || "Styvex edit"}
          </span>
          {soldOut && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sold out</span>
          )}
        </div>
        
        <Link
          to="/product/$slug"
          params={{ slug }}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-foreground transition hover:text-brand"
          title={name}
        >
          {name}
        </Link>

        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <div className="flex text-amber-500" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className="h-2.5 w-2.5 fill-current" />
            ))}
          </div>
          <span className="font-medium text-foreground">{rating?.toFixed(1) || "5.0"}</span>
          <span className="text-[10px] text-muted-foreground">{reviewCount ? `(${reviewCount})` : "New"}</span>
        </div>

        <div className="mt-auto pt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold tracking-tight text-foreground">
            {formatPrice(price)}
          </span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>

        {(colors.length > 0 || sizes.length > 0) && (
          <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
            {[
              colors.length > 0 && `${colors.length} color${colors.length > 1 ? "s" : ""}`,
              sizes.length > 0 && `${sizes.length} size${sizes.length > 1 ? "s" : ""}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {needsOptions || soldOut ? (
          <Link
            to="/product/$slug"
            params={{ slug }}
            className={cn(
              "mt-3 flex h-8 w-full items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-wider transition",
              soldOut ? "bg-muted text-muted-foreground" : "bg-ink text-primary-foreground hover:bg-brand",
            )}
          >
            {soldOut ? "View item" : "Options"}
          </Link>
        ) : (
          <button
            onClick={handleQuickAdd}
            className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-ink text-[10px] font-bold uppercase tracking-wider text-primary-foreground transition hover:bg-brand active:scale-[.98]"
          >
            <ShoppingBag className="h-3 w-3" /> Add
          </button>
        )}
      </div>
    </article>
  );
}

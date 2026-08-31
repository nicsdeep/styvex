import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  slug: string;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  categoryName,
  slug,
  className,
}: ProductCardProps) {
  // Format price as currency
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-lg bg-background", className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-muted-foreground">
            No image available
          </div>
        )}
        
        {/* Hover Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent p-4 transition-transform duration-300 ease-out group-hover:translate-y-0">
          <button className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200">
            Quick View
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-1 p-4">
        {categoryName && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {categoryName}
          </p>
        )}
        <div className="flex items-start justify-between gap-2">
          {/* We will route to a product details page later. For now it points to root */}
          <Link to="/" className="font-medium hover:underline line-clamp-2">
            {name}
          </Link>
          <span className="shrink-0 font-semibold">{formattedPrice}</span>
        </div>
      </div>
    </div>
  );
}

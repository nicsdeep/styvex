import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryNavProps {
  categories: Category[];
  activeCategorySlug?: string;
  className?: string;
}

export function CategoryNav({ categories, activeCategorySlug, className }: CategoryNavProps) {
  return (
    <nav className={cn("w-full overflow-x-auto pb-4 pt-2 hide-scrollbar", className)}>
      <ul className="flex min-w-max items-center justify-center gap-6 sm:gap-8">
        <li>
          <Link
            to="/shop"
            className={cn(
              "text-sm font-medium uppercase tracking-widest transition-colors hover:text-foreground",
              !activeCategorySlug ? "text-foreground border-b-2 border-foreground pb-1" : "text-muted-foreground"
            )}
          >
            All Products
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to="/category/$slug"
              params={{ slug: category.slug }}
              className={cn(
                "text-sm font-medium uppercase tracking-widest transition-colors hover:text-foreground",
                activeCategorySlug === category.slug 
                  ? "text-foreground border-b-2 border-foreground pb-1" 
                  : "text-muted-foreground"
              )}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

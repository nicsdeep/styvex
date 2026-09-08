import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./brand-logo";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Heart, ShoppingBag, Menu, Truck, Tag, Zap, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-y border-border/70 bg-white shadow-[0_1px_0_rgba(59,37,28,0.05)]">
      <div className="hidden border-b border-white/10 bg-ink text-primary-foreground sm:block">
        <div className="mx-auto grid h-8 max-w-[1540px] grid-cols-3 items-center px-5 text-[0.65rem] font-semibold uppercase tracking-widest md:px-10 lg:px-14">
          <p className="flex items-center justify-center gap-2 opacity-90">
            <Truck className="h-3 w-3" aria-hidden="true" /> Complimentary U.S. shipping over $50
          </p>
          <p className="flex items-center justify-center gap-2 border-x border-white/15 px-4 text-white">
            <Tag className="h-3 w-3 text-brand" aria-hidden="true" /> New arrivals, selected weekly
          </p>
          <p className="flex items-center justify-center gap-2 opacity-90">
            <Zap className="h-3 w-3" aria-hidden="true" /> A considered edit of everyday pieces
          </p>
        </div>
      </div>
      <div className="mx-auto flex h-[4.5rem] max-w-[1540px] items-center justify-between px-5 md:px-10 lg:px-14">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Main navigation links for STYVEX
              </SheetDescription>
              <div className="flex flex-col gap-6 py-6">
                <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
                  <BrandLogo mobile />
                </Link>
                <nav className="flex flex-col gap-4">
                  <Link to="/account" className="font-semibold text-purple-700">
                    {user ? "My account" : "Login / Sign up"}
                  </Link>
                  <Link
                    to="/"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    Home
                  </Link>
                  <Link
                    to="/shop"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    Shop all
                  </Link>
                  <a
                    href="/#new-arrivals"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    New arrivals
                  </a>
                  <a
                    href="/#best-sellers"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    Best sellers
                  </a>
                  <Link
                    to="/about"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    About
                  </Link>
                  <Link
                    to="/blog"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    Blog
                  </Link>
                  <Link
                    to="/contact"
                    className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                  >
                    Contact
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                    >
                      {category.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex md:flex-1">
          <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
            <BrandLogo />
          </Link>
        </div>

        {/* Desktop Centered Logo / Mobile Centered Logo */}
        <div className="flex min-w-0 flex-1 justify-center md:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
            <BrandLogo mobile />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-auto md:items-center md:justify-center md:gap-6 lg:gap-8">
          <Link
            to="/"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            Shop
          </Link>
          <a
            href="/#new-arrivals"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            New arrivals
          </a>
          <a
            href="/#best-sellers"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            Best sellers
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex items-center gap-1 py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground outline-none transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100 data-[state=open]:text-foreground data-[state=open]:after:scale-x-100">
              Categories <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="min-w-48 rounded-xl border-border/70 bg-white p-2 shadow-xl"
            >
              <DropdownMenuItem
                asChild
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
              >
                <Link to="/shop">All products</Link>
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  asChild
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <Link to="/category/$slug" params={{ slug: category.slug }}>
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            to="/about"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            About
          </Link>
          <Link
            to="/blog"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            Blog
          </Link>
          <Link
            to="/contact"
            className="relative py-7 text-xs lg:text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-[1.05rem] after:h-px after:origin-center after:scale-x-0 after:bg-brand after:transition-transform hover:text-foreground hover:after:scale-x-100"
          >
            Contact
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4">
          <Link to="/search" className="text-muted-foreground transition-colors hover:text-brand">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 whitespace-nowrap text-muted-foreground transition-colors hover:text-brand outline-none">
                <User className="h-5 w-5" />
                <span className="hidden text-xs xl:inline">Account</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl border-border/70">
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                  <Link to="/account">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                  <Link to="/account/orders">Orders</Link>
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem 
                  className="cursor-pointer rounded-lg px-3 py-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.success("Successfully logged out");
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/account"
              aria-label="Login / Sign up"
              className="flex items-center gap-1 whitespace-nowrap text-muted-foreground transition-colors hover:text-brand"
            >
              <User className="h-5 w-5" />
              <span className="hidden text-xs xl:inline">Login / Sign up</span>
            </Link>
          )}
          <Link
            to="/wishlist"
            className="hidden text-muted-foreground transition-colors hover:text-brand sm:block"
          >
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link
            to="/cart"
            className="relative text-muted-foreground transition-colors hover:text-brand"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[0.6rem] font-bold text-accent-foreground">
                {totalItems}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

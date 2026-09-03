import { Link } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/category/womens-clothing", label: "Clothing" },
  { href: "/category/handbags", label: "Bags" },
  { href: "/category/jewelry", label: "Jewelry" },
];

export function SiteHeader() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="hidden border-b border-border/60 bg-ink px-4 py-2 text-center text-[0.62rem] font-bold uppercase tracking-[0.2em] text-primary-foreground sm:block">
        Complimentary U.S. shipping on orders over $50
      </div>
      <div className="mx-auto flex h-[4.5rem] max-w-[1540px] items-center justify-between px-5 md:px-10 lg:px-14">
        {/* Mobile Menu & Logo */}
        <div className="flex flex-1 items-center gap-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation links for STYVEX</SheetDescription>
              <div className="flex flex-col gap-6 py-6">
                <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
                  <img src="/favicon.svg" alt="STYVEX logo" width={24} height={24} className="h-6 w-6" />
                  <span className="font-display text-xl font-bold uppercase tracking-[0.18em] text-foreground">Styvex</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="font-display text-2xl font-semibold transition-colors hover:text-brand"
                    >
                      {link.label}
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
            <img src="/favicon.svg" alt="STYVEX logo" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-xl font-bold uppercase tracking-[0.18em] text-foreground">Styvex</span>
          </Link>
        </div>

        {/* Desktop Centered Logo / Mobile Centered Logo */}
        <div className="flex flex-1 justify-center md:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
            <img src="/favicon.svg" alt="STYVEX logo" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-xl font-bold uppercase tracking-[0.18em] text-foreground">Styvex</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-auto md:justify-center md:gap-9">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-muted-foreground transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          <Link to="/search" className="text-muted-foreground transition-colors hover:text-brand">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Link>
          <Link to="/account" className="hidden text-muted-foreground transition-colors hover:text-brand sm:block">
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Link>
          <Link to="/wishlist" className="hidden text-muted-foreground transition-colors hover:text-brand sm:block">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link to="/cart" className="relative text-muted-foreground transition-colors hover:text-brand">
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

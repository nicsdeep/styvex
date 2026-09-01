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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-12">
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
                  <span className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">Styvex</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="text-lg font-medium transition-colors hover:text-primary"
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
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">Styvex</span>
          </Link>
        </div>

        {/* Desktop Centered Logo / Mobile Centered Logo */}
        <div className="flex flex-1 justify-center md:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
            <img src="/favicon.svg" alt="STYVEX logo" width={28} height={28} className="h-7 w-7" />
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">Styvex</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-auto md:justify-center md:gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          <Link to="/search" className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Link>
          <Link to="/account" className="hidden text-muted-foreground hover:text-foreground sm:block">
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Link>
          <Link to="/wishlist" className="hidden text-muted-foreground hover:text-foreground sm:block">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link to="/cart" className="relative text-muted-foreground hover:text-foreground">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[0.6rem] font-bold text-background">
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

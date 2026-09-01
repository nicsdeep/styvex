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
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors duration-300">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 md:px-12 lg:px-16">
        {/* Mobile Menu & Logo */}
        <div className="flex flex-1 items-center gap-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 text-foreground/80 hover:text-foreground">
                <Menu className="h-5 w-5" strokeWidth={1.5} />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-r-0 sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation links for STYVEX</SheetDescription>
              <div className="flex flex-col gap-8 py-8">
                <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
                  <span className="font-serif text-xl font-medium tracking-wide text-foreground">STYVEX</span>
                </Link>
                <nav className="flex flex-col gap-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
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
            <span className="font-serif text-2xl font-medium tracking-wider text-foreground">STYVEX</span>
          </Link>
        </div>

        {/* Desktop Centered Logo / Mobile Centered Logo */}
        <div className="flex flex-1 justify-center md:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
            <span className="font-serif text-xl font-medium tracking-wider text-foreground">STYVEX</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-auto md:justify-center md:gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium tracking-[0.1em] text-foreground/60 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex flex-1 items-center justify-end gap-5">
          <Link to="/search" className="text-foreground/80 transition-colors hover:text-foreground">
            <Search className="h-5 w-5" strokeWidth={1.5} />
            <span className="sr-only">Search</span>
          </Link>
          <Link to="/account" className="hidden text-foreground/80 transition-colors hover:text-foreground md:block">
            <User className="h-5 w-5" strokeWidth={1.5} />
            <span className="sr-only">Account</span>
          </Link>
          <Link to="/wishlist" className="hidden text-foreground/80 transition-colors hover:text-foreground md:block">
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link to="/cart" className="relative text-foreground/80 transition-colors hover:text-foreground">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[0.6rem] font-medium text-background">
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

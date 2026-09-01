import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-muted/30 pt-16 pb-8">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="grid grid-cols-2 gap-y-12 gap-x-6 md:grid-cols-4 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/favicon.svg" alt="" aria-hidden="true" width={24} height={24} className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">Styvex</span>
            </div>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Sign up for our newsletter to receive updates on new arrivals, exclusive access to sales, and editorial content.
            </p>
            <form className="flex w-full max-w-sm items-center space-x-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="flex h-10 w-full border-b border-border bg-transparent px-0 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                required
              />
              <button
                type="submit"
                className="h-10 px-4 text-sm font-medium uppercase tracking-wider text-foreground hover:text-muted-foreground transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-foreground">Shop</h3>
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link to="/category/womens-clothing" className="hover:text-foreground transition-colors">Women's Clothing</Link></li>
              <li><Link to="/category/handbags" className="hover:text-foreground transition-colors">Handbags & Bags</Link></li>
              <li><Link to="/category/jewelry" className="hover:text-foreground transition-colors">Jewelry</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-foreground">Support</h3>
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Track Order</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row text-center sm:text-left">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            &copy; {year} STYVEX. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground order-1 sm:order-2">
            <Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

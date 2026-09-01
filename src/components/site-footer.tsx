import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#111] text-white pt-16 pb-8">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="col-span-1 sm:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <span className="font-serif text-2xl font-medium tracking-wider text-white">STYVEX</span>
            </div>
            <p className="mb-6 max-w-sm text-sm text-white/70">
              Sign up for our newsletter to receive updates on new arrivals, exclusive access to sales, and editorial content.
            </p>
            <form className="flex w-full max-w-sm items-center space-x-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="flex h-10 w-full border-b border-white/20 bg-transparent px-0 py-2 text-sm placeholder:text-white/50 text-white focus:outline-none focus:border-white transition-colors"
                required
              />
              <button
                type="submit"
                className="h-10 px-4 text-sm font-medium uppercase tracking-wider text-white hover:text-white/70 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-white/90">Shop</h3>
            <ul className="flex flex-col gap-4 text-sm text-white/70">
              <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to={"/category/womens-clothing" as any} className="hover:text-white transition-colors">Women's Clothing</Link></li>
              <li><Link to={"/category/handbags" as any} className="hover:text-white transition-colors">Handbags & Bags</Link></li>
              <li><Link to={"/category/jewelry" as any} className="hover:text-white transition-colors">Jewelry</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-white/90">Support</h3>
            <ul className="flex flex-col gap-4 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row text-center sm:text-left">
          <p className="text-xs text-white/50 order-2 sm:order-1">
            &copy; {year} STYVEX. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/70 order-1 sm:order-2">
            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

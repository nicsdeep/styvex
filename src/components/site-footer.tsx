import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    setIsLoading(true);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    
    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please provide a valid email format.");
      return;
    }
    
    toast.success("Successfully subscribed to STYVEX newsletter!");
    setEmail("");
  };

  return (
    <footer className="w-full bg-[#111] text-white pt-16 pb-8">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/favicon.svg" alt="" aria-hidden="true" width={32} height={32} className="h-8 w-8 invert brightness-0" />
              <span className="text-lg md:text-xl font-bold uppercase tracking-[0.35em] text-white">Styvex</span>
            </div>
            <p className="mb-6 max-w-sm text-sm text-white/70">
              Sign up for our newsletter to receive updates on new arrivals, exclusive access to sales, and editorial content.
            </p>
            <form className="flex w-full max-w-sm items-center space-x-2" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex h-10 w-full border-b border-white/20 bg-transparent px-0 py-2 text-sm placeholder:text-white/50 text-white focus:outline-none focus:border-white transition-colors disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-10 px-4 text-sm font-medium uppercase tracking-wider text-white hover:text-white/70 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {isLoading ? "Subscribing..." : "Subscribe"}
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
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/policies/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/policies/returns" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row text-center sm:text-left">
          <p className="text-xs text-white/50 order-2 sm:order-1">
            &copy; {year} STYVEX. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/70 order-1 sm:order-2">
            <Link to="/policies/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/policies/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

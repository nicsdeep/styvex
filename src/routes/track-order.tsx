import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/track-order")({
  component: TrackOrderPage,
});

function TrackOrderPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 py-16 px-6 md:px-12 max-w-lg mx-auto w-full">
        <h1 className="text-4xl font-serif mb-4 text-foreground text-center">Track Your Order</h1>
        <p className="text-center text-foreground/70 mb-10">
          Enter your order number and email address below to see the latest updates on your shipment.
        </p>
        
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Tracking functionality will be integrated with the shipping provider."); }}>
          <div className="space-y-2">
            <label htmlFor="orderNumber" className="text-sm font-medium text-foreground">Order Number</label>
            <input 
              id="orderNumber"
              type="text" 
              placeholder="e.g. STY-12345"
              className="w-full h-12 px-4 bg-transparent border border-border focus:border-foreground focus:outline-none transition-colors"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="Used during checkout"
              className="w-full h-12 px-4 bg-transparent border border-border focus:border-foreground focus:outline-none transition-colors"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full h-12 bg-foreground text-background font-medium tracking-wide uppercase hover:bg-foreground/90 transition-colors mt-4"
          >
            Track Package
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

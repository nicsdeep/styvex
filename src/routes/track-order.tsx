import { createFileRoute, Link } from "@tanstack/react-router";
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
        <h1 className="text-4xl font-serif mb-4 text-foreground text-center">Order Updates</h1>
        <p className="text-center text-foreground/70 mb-10">
          Live tracking lookup is not yet available here. Contact us with your order reference for an update, or use the carrier link supplied with your shipment.
        </p>
        
        <Link to="/contact" className="flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">Contact us about an order</Link>
      </main>
      <SiteFooter />
    </div>
  );
}

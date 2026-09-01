import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-24 md:px-12 lg:px-24 flex items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 flex justify-center text-foreground">
            <CheckCircle className="h-16 w-16" />
          </div>
          <h1 className="mb-4 text-3xl font-light uppercase tracking-widest text-foreground">Order Confirmed</h1>
          <p className="mb-8 text-muted-foreground">
            Thank you for your purchase! We've received your order and will notify you as soon as it ships.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FREE_SHIPPING_COPY, DELIVERY_COPY, estimateShipping } from "@/lib/store-policy";

export const Route = createFileRoute("/policies/shipping")({
  component: ShippingPolicy,
});

function ShippingPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 py-16 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-serif mb-8 text-foreground">Shipping Policy</h1>
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            {FREE_SHIPPING_COPY}. This offer applies to the merchandise subtotal in USD, excluding shipping. International orders do not qualify for this U.S. offer.
          </p>
          
          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Processing Time</h2>
          <p>
            Processing depends on supplier availability. Weekends, holidays and supplier delays can affect dispatch. {DELIVERY_COPY}
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Shipping Rates & Delivery Estimates</h2>
          <p>Checkout displays the estimates below. Review the final charges on the payment page before paying. Expedited and overnight options are not currently offered.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>U.S. standard shipping: ${estimateShipping("US", 1).toFixed(2)} below or at the free-shipping threshold.</li>
            <li>Canada: ${estimateShipping("CA", 1).toFixed(2)}.</li>
            <li>United Kingdom, France and Germany: ${estimateShipping("GB", 1).toFixed(2)}.</li>
            <li>Kenya and South Africa: ${estimateShipping("KE", 1).toFixed(2)}.</li>
            <li>Australia, Italy and Japan: ${estimateShipping("AU", 1).toFixed(2)}.</li>
          </ul>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">International Shipping</h2>
          <p>
            Available destinations are listed in checkout. International orders may incur customs duties and taxes payable by the recipient. Arrival dates and carriers are not guaranteed before dispatch.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Order Tracking</h2>
          <p>
            Contact us with your order reference for shipment updates. Live tracking lookup is not currently available on the site; use a carrier tracking link if one has been supplied for your order.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

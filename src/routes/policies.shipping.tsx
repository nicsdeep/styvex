import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
            At STYVEX, we aim to deliver your order as quickly and safely as possible. We offer a variety of shipping options to meet your needs.
          </p>
          
          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Processing Time</h2>
          <p>
            All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Shipping Rates & Delivery Estimates</h2>
          <p>Shipping charges for your order will be calculated and displayed at checkout.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Standard Shipping:</strong> 3-5 business days (Free on orders over $200, otherwise $8)</li>
            <li><strong>Expedited Shipping:</strong> 2 business days ($15)</li>
            <li><strong>Overnight Shipping:</strong> 1 business day ($25)</li>
          </ul>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">International Shipping</h2>
          <p>
            We currently ship to select international destinations. Shipping rates and delivery times vary by country and will be displayed at checkout. Your order may be subject to import duties and taxes (including VAT), which are incurred once a shipment reaches your destination country. STYVEX is not responsible for these charges if they are applied and are your responsibility as the customer.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Order Tracking</h2>
          <p>
            You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

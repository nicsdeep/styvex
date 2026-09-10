import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RETURN_WINDOW_DAYS } from "@/lib/store-policy";

export const Route = createFileRoute("/policies/returns")({
  component: ReturnsPolicy,
});

function ReturnsPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 py-16 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-serif mb-8 text-foreground">Return & Refund Policy</h1>
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            We want you to be completely satisfied with your purchase from STYVEX. If for any reason you are not, we will gladly accept returns of unworn, unwashed, or defective merchandise.
          </p>
          
          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Returns</h2>
          <p>
            Request a return within {RETURN_WINDOW_DAYS} days of delivery. Items must be unused, in their original condition and packaging, with tags attached. Contact us before sending an item back so we can confirm the return instructions.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Refunds</h2>
          <p>
            Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Exchanges</h2>
          <p>
            Contact us about defective or damaged items. Replacement availability and any return instructions will be confirmed for your order.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Shipping Returns</h2>
          <p>
            Use the Contact Us page to request a return; there is no automated returns portal. Return shipping arrangements and any applicable costs will be confirmed before you send the item. Original shipping costs are non-refundable, except where applicable consumer rights require otherwise.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

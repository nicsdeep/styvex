import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
            Our return window is 30 days. If 30 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging with all tags attached.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Refunds</h2>
          <p>
            Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Exchanges</h2>
          <p>
            We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at returns@styvex.com and we will provide a return label.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">Shipping Returns</h2>
          <p>
            To return your product, please visit our Returns Portal. We provide prepaid return shipping labels for domestic returns. A return shipping fee of $8 will be deducted from your final refund amount. Original shipping costs are non-refundable.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

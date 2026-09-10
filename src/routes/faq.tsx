import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
});

function FAQPage() {
  const faqs = [
    {
      question: "What payment methods do you accept?",
      answer: "Use the payment methods shown on the payment page. If payment is unavailable, your bag is retained and no successful order is confirmed. PayPal is not currently offered.",
    },
    {
      question: "Do you ship internationally?",
      answer: "We ship to the destinations listed in checkout. See the Shipping Policy for estimates and U.S. free-shipping eligibility. International customs duties and taxes may be payable by the recipient.",
    },
    {
      question: "How can I track my order?",
      answer: "Contact us with your order reference for shipment updates. Live tracking lookup is not yet available on the site. Use a carrier tracking link if one has been supplied for your order.",
    },
    {
      question: "What is your return policy?",
      answer: "Request a return within 30 days of delivery for unused items in their original packaging with tags attached. See the Return Policy for instructions.",
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "We process orders very quickly, but if you need to cancel or modify your order, please contact us immediately at support@styvex.com. Once an order has been shipped, it cannot be modified.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 py-16 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-serif mb-8 text-foreground text-center">Frequently Asked Questions</h1>
        
        <div className="mt-12 space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-border/50 pb-6">
              <h3 className="text-xl font-medium text-foreground mb-3">{faq.question}</h3>
              <p className="text-foreground/70 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

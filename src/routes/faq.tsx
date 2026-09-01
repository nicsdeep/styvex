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
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) as well as PayPal, Apple Pay, and Google Pay for secure and convenient checkout.",
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to most countries worldwide. International shipping rates and delivery times are calculated at checkout. Please note that customs duties and taxes are the responsibility of the recipient.",
    },
    {
      question: "How can I track my order?",
      answer: "Once your order has been dispatched, you will receive a shipping confirmation email containing a tracking link. You can also track your order directly on our Track Order page.",
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for unused items in their original packaging with tags attached. Please visit our Return Policy page for full details and instructions on how to initiate a return.",
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

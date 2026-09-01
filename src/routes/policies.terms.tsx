import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/policies/terms")({
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 py-16 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-serif mb-8 text-foreground">Terms of Service</h1>
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>
            Welcome to STYVEX. By visiting our site and/ or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms of Service", "Terms"), including those additional terms and conditions and policies referenced herein and/or available by hyperlink.
          </p>
          
          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">1. Online Store Terms</h2>
          <p>
            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">2. General Conditions</h2>
          <p>
            We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">3. Accuracy of Information</h2>
          <p>
            We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources of information.
          </p>

          <h2 className="text-2xl font-serif text-foreground mt-8 mb-4">4. Modifications to the Service and Prices</h2>
          <p>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

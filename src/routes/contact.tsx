import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-foreground selection:text-background">
      <SiteHeader />
      <main className="flex-1 py-16 px-6 md:px-12 max-w-2xl mx-auto w-full">
        <h1 className="text-4xl font-serif mb-4 text-foreground text-center">Contact Us</h1>
        <p className="text-center text-foreground/70 mb-12">
          Have a question or need assistance? We're here to help. Fill out the form below or reach out to us directly.
        </p>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
              <input 
                id="firstName"
                type="text" 
                className="w-full h-12 px-4 bg-transparent border border-border focus:border-foreground focus:outline-none transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
              <input 
                id="lastName"
                type="text" 
                className="w-full h-12 px-4 bg-transparent border border-border focus:border-foreground focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
            <input 
              id="email"
              type="email" 
              className="w-full h-12 px-4 bg-transparent border border-border focus:border-foreground focus:outline-none transition-colors"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
            <textarea 
              id="message"
              rows={6}
              className="w-full p-4 bg-transparent border border-border focus:border-foreground focus:outline-none transition-colors resize-none"
              required
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="w-full h-12 bg-foreground text-background font-medium tracking-wide uppercase hover:bg-foreground/90 transition-colors"
          >
            Send Message
          </button>
        </form>

        <div className="mt-16 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
          <div>
            <h3 className="font-serif text-lg text-foreground mb-2">Email Support</h3>
            <p className="text-foreground/70">support@styvex.com</p>
          </div>
          <div>
            <h3 className="font-serif text-lg text-foreground mb-2">Business Hours</h3>
            <p className="text-foreground/70">Monday - Friday, 9am - 5pm EST</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

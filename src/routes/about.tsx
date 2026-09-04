import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 pt-[4.5rem] sm:pt-[6.5rem]">
        <section className="mx-auto max-w-[1000px] px-6 py-20 text-center md:py-28">
          <span className="eyebrow text-brand">About STYVEX</span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl font-semibold tracking-[-0.045em] text-ink md:text-7xl">
            Considered pieces for a life well lived.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            STYVEX brings together fashion, jewelry, bags, and everyday finds through a focused edit of pieces selected to feel useful, refined, and personal.
          </p>
          <Link to="/shop" className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
            Explore the edit <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

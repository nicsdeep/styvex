import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
});

const stories = [
  { label: "The STYVEX edit", title: "How to build an everyday collection that lasts", body: "A practical approach to choosing pieces that work together, season after season." },
  { label: "Style notes", title: "The considered bag: form, function, and finish", body: "The small details that make an everyday carry piece feel genuinely elevated." },
  { label: "In focus", title: "Jewelry with an effortless point of view", body: "A simple guide to choosing layers, accents, and pieces you will return to." },
];

function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 pt-[4.5rem] sm:pt-[6.5rem]">
        <section className="mx-auto max-w-[1540px] px-6 py-16 md:px-10 md:py-24 lg:px-14">
          <span className="eyebrow text-brand">Journal</span>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.045em] text-ink md:text-7xl">The STYVEX journal.</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">Notes on personal style, thoughtful choices, and the pieces we keep close.</p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {stories.map((story) => (
              <article key={story.title} className="flex min-h-64 flex-col rounded-2xl border border-border/70 bg-card p-7">
                <span className="eyebrow text-brand">{story.label}</span>
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-ink">{story.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{story.body}</p>
                <Link to="/shop" className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-foreground transition-colors hover:text-brand">Shop the edit <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

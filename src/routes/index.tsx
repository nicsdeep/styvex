import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import logoAsset from "@/assets/styvex_logo.svg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STYVEX — Women's Fashion & Lifestyle" },
      {
        name: "description",
        content:
          "STYVEX is a women's fashion and lifestyle destination, currently in development. Launching soon.",
      },
      { property: "og:title", content: "STYVEX — Women's Fashion & Lifestyle" },
      {
        property: "og:description",
        content:
          "STYVEX is a women's fashion and lifestyle destination, currently in development. Launching soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">Coming soon</p>
        <img
          src={logoAsset.url}
          alt="STYVEX"
          width={330}
          height={90}
          className="mt-6 h-auto w-[280px] max-w-full sm:w-[380px]"
        />
        <h1 className="sr-only">STYVEX</h1>
        <div className="mt-8 h-px w-24 bg-foreground/20" />
        <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
          A women&rsquo;s fashion and lifestyle destination, currently in development.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

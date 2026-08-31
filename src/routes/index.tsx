import { createFileRoute } from "@tanstack/react-router";

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">Coming soon</p>
      <h1 className="mt-6 text-6xl font-light tracking-[0.35em] text-foreground sm:text-8xl">
        STYVEX
      </h1>
      <div className="mt-8 h-px w-24 bg-foreground/20" />
      <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
        A women&rsquo;s fashion and lifestyle destination, currently in development.
      </p>
    </main>
  );
}

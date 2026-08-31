import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/search")({
  component: SearchComponent,
});

function SearchComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-10 md:px-12 lg:px-24">
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-light uppercase tracking-widest text-foreground">Search Results</h1>
          <p className="mt-4 text-muted-foreground">This section is being developed.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

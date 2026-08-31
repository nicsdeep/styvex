import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="STYVEX home">
          <img
            src="/favicon.svg"
            alt="STYVEX interlocking rings icon"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">
            Styvex
          </span>
        </Link>
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
          Coming soon
        </p>
      </div>
    </header>
  );
}

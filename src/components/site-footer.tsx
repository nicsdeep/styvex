export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Styvex</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Women&rsquo;s fashion &amp; lifestyle &middot; United States
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; {year} STYVEX. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

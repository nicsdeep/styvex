export const PRODUCTS_PER_PAGE = 8;

export function ProductPagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  if (!total) return null;
  return (
    <nav
      aria-label="Product pagination"
      className="mt-8 flex items-center justify-center gap-4 border-t border-border pt-6"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm" aria-live="polite">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

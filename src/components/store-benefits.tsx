import { Link } from "@tanstack/react-router";
import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { FREE_US_SHIPPING_THRESHOLD, RETURN_WINDOW_DAYS } from "@/lib/store-policy";

const benefits = [
  { icon: Truck, title: "Free U.S. Shipping", caption: `Orders over $${FREE_US_SHIPPING_THRESHOLD}`, href: "/policies/shipping", tone: "bg-rose-50 text-rose-700" },
  { icon: ShieldCheck, title: "Secure Checkout", caption: "Protected payments", href: "/faq", tone: "bg-emerald-50 text-emerald-700" },
  { icon: RotateCcw, title: "Easy Returns", caption: `${RETURN_WINDOW_DAYS} days from delivery`, href: "/policies/returns", tone: "bg-blue-50 text-blue-700" },
  { icon: Package, title: "Order Updates", caption: "Ask about your order", href: "/track-order", tone: "bg-amber-50 text-amber-700" },
] as const;

export function StoreBenefits({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-label="Shopping benefits" className="overflow-hidden rounded-3xl border border-neutral-200/70 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:p-4">
      <div className={cn("grid grid-cols-2", !compact && "md:grid-cols-4")}>
        {benefits.map(({ icon: Icon, title, caption, href, tone }, index) => (
          <Link key={title} to={href} className={cn(
            "flex min-w-0 flex-col items-center gap-2 px-2 py-4 text-center transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
            index % 2 === 0 && "border-r border-neutral-100",
            index < 2 && "border-b border-neutral-100",
            !compact && "md:border-b-0 md:px-4 md:py-5",
            !compact && index < 3 && "md:border-r",
          )}>
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14", tone)}>
              <Icon aria-hidden="true" className="h-5 w-5 stroke-[1.6] sm:h-6 sm:w-6" />
            </span>
            <span className="mt-1 text-xs font-semibold leading-5 text-neutral-950 sm:text-sm">{title}</span>
            <span className="text-[10px] leading-4 text-neutral-500 sm:text-xs">{caption}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

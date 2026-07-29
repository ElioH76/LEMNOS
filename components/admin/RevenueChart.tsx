import { formatEuro } from "@/lib/billing/calc";
import { MONTH_LABELS } from "@/lib/billing/stats";
import { cn } from "@/lib/cn";

/** Graphique en barres du CA mensuel (SVG pur, sans dépendance). */
export function RevenueChart({ monthly, currentMonth }: { monthly: number[]; currentMonth: number }) {
  const max = Math.max(...monthly, 1);
  const total = monthly.reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">
            Chiffre d&apos;affaires {new Date().getFullYear()}
          </div>
          <div className="mt-1 text-[22px] font-extrabold tabular-nums">{formatEuro(total)}</div>
        </div>
        <div className="text-[12px] text-ash">Factures payées, par mois</div>
      </div>

      <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2.5">
        {monthly.map((value, i) => {
          const h = Math.max(2, Math.round((value / max) * 100));
          const isCurrent = i === currentMonth;
          return (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className="relative w-full rounded-t-sm transition-colors"
                style={{ height: `${h}%` }}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-t-sm",
                    isCurrent ? "bg-green" : "bg-green/30 group-hover:bg-green/60",
                  )}
                />
                {value > 0 && (
                  <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-ink opacity-0 transition-opacity group-hover:opacity-100">
                    {formatEuro(value)}
                  </div>
                )}
              </div>
              <span className={cn("text-[10px]", isCurrent ? "font-bold text-green" : "text-ash")}>
                {MONTH_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

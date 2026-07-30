import { cn } from "@/lib/cn";

/**
 * Histogramme générique (SVG-free, barres en div) pour des séries d'entiers —
 * ex. commandes livrées par mois. Pour le CA en euros, garder `RevenueChart`.
 */
export function BarChart({
  values,
  labels,
  highlightIndex,
}: {
  values: number[];
  labels: string[];
  highlightIndex?: number;
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-40 items-end gap-1.5 sm:gap-2.5">
      {values.map((value, i) => {
        const h = value > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
        const isCurrent = i === highlightIndex;
        return (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-t-sm transition-colors",
                  isCurrent ? "bg-green" : "bg-green/30 group-hover:bg-green/60",
                )}
                style={{ height: `${h}%` }}
              />
              {value > 0 && (
                <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-ink opacity-0 transition-opacity group-hover:opacity-100">
                  {value}
                </div>
              )}
            </div>
            <span className={cn("text-[10px]", isCurrent ? "font-bold text-green" : "text-ash")}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

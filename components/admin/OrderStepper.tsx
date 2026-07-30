import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ORDER_STATUSES,
  ORDER_STATUS_SHORT,
  orderStatusIndex,
  type OrderEvent,
  type OrderStatus,
} from "@/lib/orders/types";

function frDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(iso));
}

/**
 * Frise d'avancement du pipeline (5 étapes). `compact` : rangée de segments
 * sans texte (cartes de liste). Sinon : nœuds numérotés + libellés, et la date
 * du jalon si `events` est fourni (page détail).
 */
export function OrderStepper({
  status,
  events,
  compact = false,
}: {
  status: OrderStatus;
  events?: OrderEvent[];
  compact?: boolean;
}) {
  const current = orderStatusIndex(status);

  if (compact) {
    return (
      <div className="flex items-center gap-1" aria-label={`Étape ${current + 1} sur ${ORDER_STATUSES.length}`}>
        {ORDER_STATUSES.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-pill transition-colors",
              i <= current ? "bg-green" : "bg-line",
            )}
          />
        ))}
      </div>
    );
  }

  // Dernier jalon atteint pour chaque état (pour afficher sa date).
  const lastEventFor = (s: OrderStatus) =>
    events?.filter((e) => e.status === s).slice(-1)[0];

  return (
    <ol className="flex items-start">
      {ORDER_STATUSES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const ev = lastEventFor(s);
        return (
          <li key={s} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-pill",
                  i === 0 ? "opacity-0" : i <= current ? "bg-green" : "bg-line",
                )}
              />
              <span
                className={cn(
                  "flex h-8 w-8 flex-none items-center justify-center rounded-full border-[1.5px] text-[12px] font-bold tabular-nums transition-colors",
                  done && "border-green bg-green text-white",
                  active && "border-green bg-green-soft text-green",
                  !done && !active && "border-line bg-white text-ash",
                )}
              >
                {done ? <Check size={15} aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-pill",
                  i === ORDER_STATUSES.length - 1 ? "opacity-0" : i < current ? "bg-green" : "bg-line",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 px-1 text-[11.5px] font-semibold leading-tight",
                active ? "text-green" : done ? "text-ink" : "text-ash",
              )}
            >
              {ORDER_STATUS_SHORT[s]}
            </span>
            <span className="mt-0.5 min-h-[14px] text-[10.5px] tabular-nums text-ash">
              {ev ? frDate(ev.at) : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

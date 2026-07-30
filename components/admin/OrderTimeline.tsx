import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, type OrderEvent } from "@/lib/orders/types";

function frDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Journal chronologique des jalons — le plus récent en haut. */
export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return <p className="py-4 text-center text-[13.5px] text-ash">Aucun jalon enregistré.</p>;
  }

  const ordered = [...events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ol className="flex flex-col">
      {ordered.map((event, index) => {
        const isLatest = index === 0;
        const isLast = index === ordered.length - 1;
        return (
          <li key={event.id} className="flex gap-3.5">
            {/* Rail : pastille + trait vertical de liaison. */}
            <div className="flex flex-none flex-col items-center">
              <span
                className={cn(
                  "mt-1 h-3 w-3 rounded-full border-2",
                  isLatest ? "border-green bg-green" : "border-line bg-white",
                )}
              />
              {!isLast && <span className="w-0.5 flex-1 bg-line" />}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className={cn("text-[13.5px] font-bold tracking-tight", isLatest ? "text-ink" : "text-slate")}>
                  {ORDER_STATUS_LABEL[event.status]}
                </span>
                <span className="text-[11.5px] tabular-nums text-ash">{frDateTime(event.at)}</span>
              </div>
              {event.note && (
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.55] text-slate">{event.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

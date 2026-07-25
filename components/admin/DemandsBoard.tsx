"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { DEMAND_STATUSES, STATUS_LABEL, type Demand, type DemandStatus } from "@/lib/demands/types";
import { DemandCard } from "./DemandCard";

type Filter = "tous" | DemandStatus;

export function DemandsBoard({ demands }: { demands: Demand[] }) {
  const [filter, setFilter] = useState<Filter>("tous");

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      tous: demands.length,
      nouveau: 0,
      en_cours: 0,
      traite: 0,
      archive: 0,
    };
    for (const d of demands) base[d.status] += 1;
    return base;
  }, [demands]);

  const filtered = filter === "tous" ? demands : demands.filter((d) => d.status === filter);

  const tabs: Filter[] = ["tous", ...DEMAND_STATUSES];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors",
              filter === tab
                ? "bg-ink text-white"
                : "border border-line bg-white text-slate hover:border-green hover:text-green",
            )}
          >
            {tab === "tous" ? "Toutes" : STATUS_LABEL[tab]}
            <span className={cn("ml-2 tabular-nums", filter === tab ? "text-white/70" : "text-ash")}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-[14px] text-ash">
          Aucune demande {filter === "tous" ? "pour l'instant" : `« ${STATUS_LABEL[filter]} »`}.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {filtered.map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))}
        </div>
      )}
    </div>
  );
}

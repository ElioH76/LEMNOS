"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/orders/types";
import { OrderCard } from "./OrderCard";

type Filter = "toutes" | OrderStatus;

export function OrdersBoard({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<Filter>("toutes");

  const counts = useMemo(() => {
    const base = { toutes: orders.length } as Record<Filter, number>;
    for (const s of ORDER_STATUSES) base[s] = 0;
    for (const o of orders) base[o.status] += 1;
    return base;
  }, [orders]);

  const filtered = filter === "toutes" ? orders : orders.filter((o) => o.status === filter);
  const tabs: Filter[] = ["toutes", ...ORDER_STATUSES];

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
            {tab === "toutes" ? "Toutes" : ORDER_STATUS_LABEL[tab]}
            <span className={cn("ml-2 tabular-nums", filter === tab ? "text-white/70" : "text-ash")}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-[14px] text-ash">
          Aucune commande {filter === "toutes" ? "pour l'instant" : `« ${ORDER_STATUS_LABEL[filter]} »`}.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

import { ORDER_STATUSES, type Order, type OrderStatus } from "./types";

export interface OrderStats {
  total: number;
  /** Commandes non encore livrées. */
  inProgress: number;
  delivered: number;
  deliveredYear: number;
  deliveredMonth: number;
  /** Répartition par état (les 5 du pipeline). */
  byStatus: Record<OrderStatus, number>;
  /** Délai moyen création → livraison, en jours (null si aucune livrée). */
  avgLeadTimeDays: number | null;
  /** Nombre de commandes livrées par mois pour l'année en cours (12 valeurs). */
  monthlyDelivered: number[];
}

/** Dernier jalon « Livré » d'une commande (date ISO), ou null. */
function deliveredAt(order: Order): string | null {
  const ev = order.events.filter((e) => e.status === "livre").slice(-1)[0];
  return ev ? ev.at : null;
}

/** Agrège les indicateurs de commandes. Pur → réutilisable (dashboard + stats). */
export function computeOrderStats(orders: Order[], now = new Date()): OrderStats {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthlyDelivered = new Array(12).fill(0);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<
    OrderStatus,
    number
  >;

  let delivered = 0;
  let deliveredYear = 0;
  let deliveredMonth = 0;
  let leadSum = 0;
  let leadCount = 0;

  for (const order of orders) {
    byStatus[order.status] += 1;

    if (order.status === "livre") {
      delivered += 1;
      const at = deliveredAt(order);
      if (at) {
        const d = new Date(at);
        if (d.getFullYear() === year) {
          deliveredYear += 1;
          monthlyDelivered[d.getMonth()] += 1;
          if (d.getMonth() === month) deliveredMonth += 1;
        }
        const created = new Date(order.createdAt).getTime();
        const days = (d.getTime() - created) / 86_400_000;
        if (Number.isFinite(days) && days >= 0) {
          leadSum += days;
          leadCount += 1;
        }
      }
    }
  }

  return {
    total: orders.length,
    inProgress: orders.length - delivered,
    delivered,
    deliveredYear,
    deliveredMonth,
    byStatus,
    avgLeadTimeDays: leadCount > 0 ? Math.round(leadSum / leadCount) : null,
    monthlyDelivered,
  };
}

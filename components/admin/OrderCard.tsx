"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Package, Shirt } from "lucide-react";
import { setOrderStatusAction } from "@/app/actions/orders";
import { nextOrderStatus, ORDER_STATUS_LABEL, type Order } from "@/lib/orders/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStepper } from "./OrderStepper";

function frDate(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export function OrderCard({ order }: { order: Order }) {
  const [busy, setBusy] = useState(false);
  const next = nextOrderStatus(order.status);

  return (
    <article className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-card">
      <Link href={`/admin/commandes/${order.id}`} className="block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[13px] font-bold tracking-tight text-ink">{order.number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <h3 className="mt-1 truncate text-[16px] font-bold tracking-tight">{order.title}</h3>
            <div className="mt-0.5 text-[13px] text-slate">{order.clientName}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-ash">
          {order.sport && (
            <span className="flex items-center gap-1.5">
              <Shirt size={13} aria-hidden /> {order.sport}
            </span>
          )}
          {order.quantity && (
            <span className="flex items-center gap-1.5">
              <Package size={13} aria-hidden /> {order.quantity}
            </span>
          )}
          {order.dueDate && (
            <span className="flex items-center gap-1.5">
              <CalendarClock size={13} aria-hidden /> Livraison {frDate(order.dueDate)}
            </span>
          )}
        </div>

        <div className="mt-4">
          <OrderStepper status={order.status} compact />
        </div>
      </Link>

      {next && (
        <form
          action={setOrderStatusAction}
          onSubmit={() => setBusy(true)}
          className="mt-4 flex justify-end border-t border-line-soft pt-3"
        >
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="status" value={next} />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-sharp border border-line px-3 py-1.5 text-[12px] font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:opacity-50"
          >
            Passer à « {ORDER_STATUS_LABEL[next]} »
            <ArrowRight size={13} aria-hidden />
          </button>
        </form>
      )}
    </article>
  );
}

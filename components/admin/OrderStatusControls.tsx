"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { setOrderStatusAction } from "@/app/actions/orders";
import { cn } from "@/lib/cn";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  nextOrderStatus,
  type OrderStatus,
} from "@/lib/orders/types";

/**
 * Pilotage de l'avancement d'une commande. La note est un état contrôlé, injecté
 * dans chaque formulaire via un input caché : on ne dépend pas de la valeur du
 * bouton submitter (que `new FormData(form)` n'embarque pas). Chaque bouton porte
 * donc son statut et la note courante en champs cachés — même pattern que la
 * DemandCard. Bouton principal = étape suivante du pipeline.
 */
export function OrderStatusControls({ id, status }: { id: string; status: OrderStatus }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const next = nextOrderStatus(status);

  const hidden = (s: OrderStatus) => (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={s} />
      <input type="hidden" name="note" value={note} />
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink" htmlFor="order-note">
          Note du jalon <span className="font-normal text-ash">(optionnel)</span>
        </label>
        <textarea
          id="order-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex. maquette envoyée au client, n° de suivi Colissimo…"
          className="min-h-16 w-full resize-y rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green"
        />
      </div>

      {next && (
        <form action={setOrderStatusAction} onSubmit={() => setBusy(true)}>
          {hidden(next)}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-sharp bg-green px-5 py-3 text-[14px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-60"
          >
            Passer à « {ORDER_STATUS_LABEL[next]} »
            <ArrowRight size={16} aria-hidden />
          </button>
        </form>
      )}

      <div>
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-caps text-ash">
          Ou définir directement l'étape
        </span>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <form key={s} action={setOrderStatusAction} onSubmit={() => setBusy(true)} className="contents">
              {hidden(s)}
              <button
                type="submit"
                disabled={busy || s === status}
                className={cn(
                  "rounded-sharp px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-default",
                  s === status
                    ? "bg-ink text-white"
                    : "border border-line text-slate hover:border-green hover:text-green disabled:opacity-50",
                )}
              >
                {ORDER_STATUS_LABEL[s]}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

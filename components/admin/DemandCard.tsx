"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock, FileText, Mail, Phone, Trash2 } from "lucide-react";
import { removeDemand, setDemandStatus } from "@/app/actions/demands";
import { cn } from "@/lib/cn";
import { DEMAND_STATUSES, STATUS_LABEL, type Demand } from "@/lib/demands/types";
import { DemandStatusBadge } from "./DemandStatusBadge";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function DemandCard({ demand }: { demand: Demand }) {
  const [busy, setBusy] = useState(false);

  const confirmDelete = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer définitivement la demande de « ${demand.structure} » ?`)) {
      event.preventDefault();
    }
  };

  return (
    <article className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[17px] font-bold tracking-tight">{demand.structure}</h3>
            <DemandStatusBadge status={demand.status} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ash">
            <CalendarClock size={13} aria-hidden />
            {formatDate(demand.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-slate">
        <span>
          <span className="text-ash">Type&nbsp;:</span> {demand.type}
        </span>
        {demand.sport && (
          <span>
            <span className="text-ash">Sport&nbsp;:</span> {demand.sport}
          </span>
        )}
        {demand.quantity && (
          <span>
            <span className="text-ash">Quantité&nbsp;:</span> {demand.quantity}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
        <a
          href={`mailto:${demand.email}`}
          className="flex items-center gap-1.5 font-medium text-green transition-colors hover:text-green-dark"
        >
          <Mail size={13} aria-hidden />
          {demand.email}
        </a>
        {demand.phone && (
          <a
            href={`tel:${demand.phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 font-medium text-green transition-colors hover:text-green-dark"
          >
            <Phone size={13} aria-hidden />
            {demand.phone}
          </a>
        )}
      </div>

      <p className="mt-4 whitespace-pre-wrap rounded-field bg-paper px-4 py-3 text-[14px] leading-[1.6] text-prose">
        {demand.brief}
      </p>

      {demand.files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {demand.files.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className="flex items-center gap-1.5 rounded-field bg-paper px-2.5 py-1.5 text-[12px] text-slate"
            >
              <FileText size={13} aria-hidden className="text-green" />
              {name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-caps text-ash">
          Statut
        </span>
        {DEMAND_STATUSES.map((status) => (
          <form
            key={status}
            action={setDemandStatus}
            onSubmit={() => setBusy(true)}
            className="contents"
          >
            <input type="hidden" name="id" value={demand.id} />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              disabled={busy || status === demand.status}
              className={cn(
                "rounded-sharp px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-default",
                status === demand.status
                  ? "bg-green text-white"
                  : "border border-line text-slate hover:border-green hover:text-green disabled:opacity-50",
              )}
            >
              {STATUS_LABEL[status]}
            </button>
          </form>
        ))}

        <form action={removeDemand} onSubmit={confirmDelete} className="ml-auto">
          <input type="hidden" name="id" value={demand.id} />
          <button
            type="submit"
            aria-label="Supprimer la demande"
            className="flex items-center gap-1.5 rounded-sharp px-3 py-1.5 text-[12px] font-semibold text-ash transition-colors hover:bg-paper hover:text-ink"
          >
            <Trash2 size={14} aria-hidden />
            Supprimer
          </button>
        </form>
      </div>
    </article>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Factory, Plus, Trash2, Truck } from "lucide-react";
import { deletePaymentAction, recordPaymentAction, setFulfillmentAction } from "@/app/actions/commercial";
import { formatEuro, frDate, frDateTime, todayIso } from "@/lib/billing/calc";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  displayNumber,
  documentTitle,
  type CommercialDocument,
  type HistoryEvent,
  type PaymentMethod,
} from "@/lib/billing/types";
import type { WorkflowStep } from "@/lib/billing/workflow";
import { cn } from "@/lib/cn";
import { DocStatusBadge } from "./StatusBadge";
import { BTN, BTN_PRIMARY, ErrorNote, FIELD, LABEL, NumberInput, Section } from "./ui";

// ── Paiements ──────────────────────────────────────────────────────────────

export function PaymentsPanel({
  doc,
  amountDue,
  paid,
  outstanding,
}: {
  doc: CommercialDocument;
  amountDue: number;
  paid: number;
  outstanding: number;
}) {
  const router = useRouter();
  const canPay = doc.lifecycle === "emise" && outstanding > 0;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    date: todayIso(),
    amount: outstanding,
    method: doc.paymentMethod as PaymentMethod,
    reference: "",
    comment: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await recordPaymentAction(doc.id, f);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Enregistrement impossible.");
    setOpen(false);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce paiement (saisie erronée) ? La suppression est tracée dans l'historique.")) return;
    const res = await deletePaymentAction(doc.id, id);
    if (!res.ok) setError(res.error ?? "Suppression impossible.");
    router.refresh();
  };

  const pct = amountDue > 0 ? Math.min(100, Math.round((paid / amountDue) * 100)) : 0;

  return (
    <Section title="Paiements" action={<DocStatusBadge doc={doc} />}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Facturé" value={formatEuro(amountDue)} />
        <Mini label="Encaissé" value={formatEuro(paid)} green />
        <Mini label="Reste" value={formatEuro(outstanding)} strong={outstanding > 0} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-green transition-all" style={{ width: `${pct}%` }} />
      </div>

      {doc.payments.length > 0 && (
        <ul className="mt-4 divide-y divide-line-soft">
          {doc.payments.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
              <div className="min-w-0">
                <div className="font-semibold tabular-nums">
                  {formatEuro(p.amount)} <span className="font-normal text-ash">· {frDate(p.date)}</span>
                </div>
                <div className="text-[12px] text-ash">
                  {PAYMENT_METHOD_LABEL[p.method]}
                  {p.reference ? ` · réf. ${p.reference}` : ""}
                </div>
                {p.comment && <div className="text-[12px] text-slate">{p.comment}</div>}
              </div>
              {doc.lifecycle === "emise" && !p.id.startsWith("legacy-") && (
                <button type="button" onClick={() => remove(p.id)} title="Supprimer" className="rounded-sharp p-1.5 text-ash hover:bg-danger-soft hover:text-danger">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {doc.lifecycle === "brouillon" && <p className="mt-4 text-[12.5px] text-ash">Les paiements s&apos;enregistrent une fois la facture émise.</p>}

      {canPay && !open && (
        <button
          type="button"
          onClick={() => {
            setF((prev) => ({ ...prev, amount: outstanding, date: todayIso() }));
            setOpen(true);
          }}
          className={cn(BTN_PRIMARY, "mt-4 w-full")}
        >
          <Plus size={15} /> Enregistrer un paiement
        </button>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-paper/50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL}>Date</label>
              <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={FIELD} />
            </div>
            <div>
              <label className={LABEL}>Montant (€)</label>
              <NumberInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Moyen de paiement</label>
            <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as PaymentMethod })} className={FIELD}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Référence</label>
            <input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="N° de virement, de chèque…" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Commentaire</label>
            <input value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} className={FIELD} />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={busy} className={cn(BTN_PRIMARY, "flex-1")}>
              {busy ? "Enregistrement…" : "Valider le paiement"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={BTN}>
              Annuler
            </button>
          </div>
        </div>
      )}
      {!open && <ErrorNote>{error}</ErrorNote>}
    </Section>
  );
}

function Mini({ label, value, green, strong }: { label: string; value: string; green?: boolean; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-paper/70 px-2 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-caps text-ash">{label}</div>
      <div className={cn("mt-0.5 text-[14px] font-extrabold tabular-nums", green && "text-green", strong && "text-ink")}>{value}</div>
    </div>
  );
}

// ── Suivi de commande (production / livraison) ─────────────────────────────

export function FulfillmentPanel({ doc }: { doc: CommercialDocument }) {
  const router = useRouter();
  const [prodDate, setProdDate] = useState(doc.fulfillment.productionAt ?? todayIso());
  const [delivDate, setDelivDate] = useState(doc.fulfillment.deliveredAt ?? todayIso());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (step: "production" | "delivered", date: string) => {
    setBusy(true);
    setError(null);
    const res = await setFulfillmentAction(doc.id, step, date);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Impossible.");
    router.refresh();
  };

  return (
    <Section title="Suivi de commande">
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold">
            <Factory size={15} className="text-green" /> Production
            {doc.fulfillment.productionAt && <span className="font-normal text-ash">depuis le {frDate(doc.fulfillment.productionAt)}</span>}
          </div>
          <div className="flex gap-2">
            <input type="date" value={prodDate} onChange={(e) => setProdDate(e.target.value)} className={FIELD} />
            <button type="button" disabled={busy} onClick={() => save("production", prodDate)} className={BTN}>
              {doc.fulfillment.productionAt ? "Modifier" : "En production"}
            </button>
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold">
            <Truck size={15} className="text-green" /> Livraison réelle
            {doc.fulfillment.deliveredAt && <span className="font-normal text-ash">le {frDate(doc.fulfillment.deliveredAt)}</span>}
          </div>
          <div className="flex gap-2">
            <input type="date" value={delivDate} onChange={(e) => setDelivDate(e.target.value)} className={FIELD} />
            <button type="button" disabled={busy} onClick={() => save("delivered", delivDate)} className={BTN}>
              {doc.fulfillment.deliveredAt ? "Modifier" : "Livré"}
            </button>
          </div>
          <p className="mt-1 text-[11.5px] text-ash">
            Prévisionnelle au devis : {doc.plannedDeliveryDate ? frDate(doc.plannedDeliveryDate) : doc.deliveryLeadTime || "—"}. La date
            réelle est reprise sur la facture finale.
          </p>
        </div>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Section>
  );
}

// ── Parcours, historique, documents liés (affichage) ───────────────────────

export function WorkflowStepper({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-2">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11.5px] font-semibold",
              s.done
                ? "border-green bg-green text-white"
                : s.current
                  ? "border-green bg-green-soft text-green"
                  : "border-line bg-white text-ash",
            )}
            title={s.detail}
          >
            {s.label}
            {s.detail && <span className="font-mono text-[10.5px] opacity-80">{s.detail}</span>}
          </span>
          {i < steps.length - 1 && <span className={cn("h-px w-3", s.done ? "bg-green" : "bg-line")} aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export function HistoryList({ events }: { events: HistoryEvent[] }) {
  if (events.length === 0) return <p className="text-[13px] text-ash">Aucun événement.</p>;
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <ol className="flex flex-col">
      {ordered.map((e, i) => (
        <li key={e.id} className="flex gap-3">
          <div className="flex flex-none flex-col items-center">
            <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full", i === ordered.length - 1 ? "bg-green" : "bg-line-dark/40")} />
            {i < ordered.length - 1 && <span className="w-px flex-1 bg-line" />}
          </div>
          <div className="pb-3.5">
            <div className="text-[11.5px] tabular-nums text-ash">{frDateTime(e.at)}</div>
            <div className="text-[13px] font-semibold">{e.label}</div>
            {e.detail && <div className="text-[12.5px] text-slate">{e.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LinkedDocumentsList({
  docs,
  currentId,
  amounts,
}: {
  docs: CommercialDocument[];
  currentId: string;
  amounts: Record<string, number>;
}) {
  if (docs.length <= 1) return <p className="text-[13px] text-ash">Aucun autre document lié.</p>;
  return (
    <ol className="flex flex-col gap-1.5">
      {docs.map((d, i) => {
        const href = d.type === "devis" ? `/admin/devis/${d.id}` : `/admin/factures/${d.id}`;
        const current = d.id === currentId;
        return (
          <li key={d.id}>
            <Link
              href={href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-colors",
                current ? "border-green bg-green-soft/60" : "border-line hover:border-green",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {i > 0 && <span className="text-ash">↳</span>}
                  <span className="font-mono font-semibold">{displayNumber(d)}</span>
                </div>
                <div className="truncate text-[11.5px] text-ash">{documentTitle(d)}</div>
              </div>
              <div className="flex flex-none flex-col items-end gap-1">
                <span className="font-semibold tabular-nums">{formatEuro(amounts[d.id] ?? 0)}</span>
                <DocStatusBadge doc={d} />
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

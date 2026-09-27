"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Lock, Plus, Save, Star, Trash2, UserPlus } from "lucide-react";
import { saveInvoiceAction, saveProductTemplateAction, saveQuoteAction } from "@/app/actions/commercial";
import {
  addDays,
  documentAmounts,
  formatDiscount,
  formatEuro,
  frDate,
  lineHt,
  todayIso,
} from "@/lib/billing/calc";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  type Client,
  type CommercialDocument,
  type DepositType,
  type DiscountType,
  type DocumentInput,
  type DocumentLine,
  type PaymentMethod,
  type ProductTemplate,
} from "@/lib/billing/types";
import { cn } from "@/lib/cn";
import { QuickClientDialog } from "./QuickClientDialog";
import { BTN, BTN_PRIMARY, ErrorNote, FIELD, Field, LABEL, NumberInput, Section, TextArea, WarnNote } from "./ui";

export interface FormDefaults {
  vatExempt: boolean;
  vatMention: string;
  depositPercent: number;
  quoteValidityDays: number;
  paymentTermsText: string;
  paymentDelayDays: number;
  paymentMethod: PaymentMethod;
}

const VAT_RATES = [20, 10, 5.5, 2.1, 0];

function newLine(vatExempt: boolean): DocumentLine {
  return {
    id: crypto.randomUUID(),
    label: "",
    description: "",
    quantity: 1,
    unitPriceHt: 0,
    vatRate: vatExempt ? 0 : 20,
    discountType: "percent",
    discountValue: 0,
  };
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * Formulaire unique devis / facture. Les totaux sont recalculés en direct avec
 * les MÊMES fonctions que le serveur et le PDF (lib/billing/calc.ts).
 */
export function DocumentForm({
  type,
  initial,
  clients: initialClients,
  templates: initialTemplates,
  defaults,
  preselectClientId,
}: {
  type: "devis" | "facture";
  initial?: CommercialDocument;
  clients: Client[];
  templates: ProductTemplate[];
  defaults: FormDefaults;
  preselectClientId?: string;
}) {
  const router = useRouter();
  const isQuote = type === "devis";
  const vatExempt = initial?.vatExempt ?? defaults.vatExempt;
  // Facture issue d'un devis (acompte / solde) ou avoir : lignes figées.
  const linesLocked = !!initial && (!!initial.quoteId || initial.type === "avoir");
  const isDeposit = initial?.kind === "acompte";

  const [clients, setClients] = useState(initialClients);
  const [templates, setTemplates] = useState(initialTemplates);
  const [showNewClient, setShowNewClient] = useState(false);

  const today = todayIso();
  const [clientId, setClientId] = useState<string>(initial?.clientId ?? preselectClientId ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [validityDays, setValidityDays] = useState(
    initial?.validUntil ? Math.max(1, daysBetween(initial.date, initial.validUntil)) : defaults.quoteValidityDays,
  );
  const [dueDelay, setDueDelay] = useState(
    initial?.dueDate ? Math.max(0, daysBetween(initial.date, initial.dueDate)) : defaults.paymentDelayDays,
  );
  const [deliveryDate, setDeliveryDate] = useState(initial?.deliveryDate ?? "");
  const [plannedDeliveryDate, setPlannedDeliveryDate] = useState(initial?.plannedDeliveryDate ?? "");
  const [deliveryLeadTime, setDeliveryLeadTime] = useState(initial?.deliveryLeadTime ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? defaults.paymentMethod);
  const [lines, setLines] = useState<DocumentLine[]>(initial?.lines?.length ? initial.lines : [newLine(vatExempt)]);
  const [globalDiscountType, setGlobalDiscountType] = useState<DiscountType>(initial?.globalDiscountType ?? "percent");
  const [globalDiscountValue, setGlobalDiscountValue] = useState(initial?.globalDiscountValue ?? 0);
  const [globalDiscountLabel, setGlobalDiscountLabel] = useState(initial?.globalDiscountLabel ?? "Remise");
  const [shipping, setShipping] = useState(initial?.shipping ?? 0);
  const [depositType, setDepositType] = useState<DepositType>(
    initial ? initial.depositType : defaults.depositPercent > 0 ? "percent" : "none",
  );
  const [depositValue, setDepositValue] = useState(initial ? initial.depositValue : defaults.depositPercent);
  const [depositAmount, setDepositAmount] = useState(initial?.depositAmount ?? 0);
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? defaults.paymentTermsText);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [internalComments, setInternalComments] = useState(initial?.internalComments ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = clients.find((c) => c.id === clientId);
  const validUntil = addDays(date, validityDays);
  const dueDate = addDays(date, dueDelay);

  const input: DocumentInput = {
    clientId: clientId || null,
    subject,
    date,
    lines,
    globalDiscountType,
    globalDiscountValue,
    globalDiscountLabel,
    shipping,
    notes,
    paymentTerms,
    internalComments,
    validUntil: isQuote ? validUntil : "",
    plannedDeliveryDate,
    deliveryLeadTime,
    depositType: isQuote ? depositType : "none",
    depositValue: isQuote ? depositValue : 0,
    dueDate: isQuote ? "" : dueDate,
    deliveryDate,
    paymentMethod,
    depositAmount,
  };

  const amounts = useMemo(
    () =>
      documentAmounts({
        ...(initial ?? ({} as CommercialDocument)),
        ...input,
        type: isQuote ? "devis" : initial?.type ?? "facture",
        kind: initial?.kind ?? "standard",
        vatExempt,
        deductions: initial?.deductions ?? [],
        payments: [],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(input), vatExempt],
  );

  const patchLine = (id: string, patch: Partial<DocumentLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const moveLine = (index: number, dir: -1 | 1) =>
    setLines((ls) => {
      const next = [...ls];
      const target = index + dir;
      if (target < 0 || target >= next.length) return ls;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const insertTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setLines((ls) => [
      ...ls.filter((l) => l.label || l.unitPriceHt),
      {
        ...newLine(vatExempt),
        label: t.label,
        description: t.description ?? "",
        unitPriceHt: t.unitPriceHt,
        vatRate: vatExempt ? 0 : t.vatRate,
      },
    ]);
  };

  const saveTemplate = async (line: DocumentLine) => {
    if (!line.label.trim()) return setError("Donnez une désignation à la ligne avant d'en faire un modèle.");
    const tpl = await saveProductTemplateAction({
      label: line.label,
      description: line.description,
      unitPriceHt: line.unitPriceHt,
      vatRate: line.vatRate,
    });
    setTemplates((ts) => [tpl, ...ts]);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (!clientId) return setError("Sélectionnez un client (ou créez-le avec « + Nouveau client »).");
    setSaving(true);
    const save = isQuote ? saveQuoteAction : saveInvoiceAction;
    const res = await save(initial?.id ?? null, input);
    setSaving(false);
    if (res.ok && res.id) {
      router.push(`/admin/${isQuote ? "devis" : "factures"}/${res.id}`);
      router.refresh();
    } else setError(res.error ?? "Enregistrement impossible.");
  };

  const cancelHref = initial ? `/admin/${isQuote ? "devis" : "factures"}/${initial.id}` : `/admin/${isQuote ? "devis" : "factures"}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        {/* CLIENT */}
        <Section title="Client">
          {linesLocked ? (
            <p className="text-[14px] font-semibold">{initial?.client.club}</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className={LABEL}>
                  Client <span className="text-danger">*</span>
                </label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={FIELD}>
                  <option value="">— Sélectionner un client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.club}
                      {c.city ? ` — ${c.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => setShowNewClient(true)} className={BTN}>
                <UserPlus size={15} /> Nouveau client
              </button>
            </div>
          )}
          {client && (
            <div className="mt-4 rounded-xl bg-paper/70 px-4 py-3 text-[13px] leading-[1.6] text-slate">
              <div className="font-semibold text-ink">{client.club}</div>
              {client.contact && (
                <div>
                  {client.contact}
                  {client.contactRole ? ` — ${client.contactRole}` : ""}
                </div>
              )}
              <div>{[client.address, [client.zip, client.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "Adresse non renseignée"}</div>
              {client.email && <div>{client.email}</div>}
              <Link href={`/admin/clients/${client.id}/modifier`} className="mt-1 inline-block text-[12px] font-semibold text-green hover:underline">
                Compléter la fiche client →
              </Link>
            </div>
          )}
          {client && (!client.address || !client.city) && (
            <div className="mt-3">
              <WarnNote>L&apos;adresse du client est une mention obligatoire des factures : pensez à la compléter.</WarnNote>
            </div>
          )}
        </Section>

        <Section title="Objet">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Équipement FC Littoral — 15 kits de football personnalisés"
            className={FIELD}
          />
        </Section>

        {/* LIGNES */}
        <Section
          title="Lignes"
          action={
            !linesLocked && templates.length > 0 ? (
              <select
                value=""
                onChange={(e) => e.target.value && insertTemplate(e.target.value)}
                className="max-w-[200px] rounded-field border-[1.5px] border-line bg-white px-2.5 py-1.5 text-[12.5px]"
                aria-label="Insérer un produit enregistré"
              >
                <option value="">+ Produit enregistré…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {formatEuro(t.unitPriceHt)}
                  </option>
                ))}
              </select>
            ) : null
          }
        >
          {linesLocked ? (
            <>
              <p className="mb-3 flex items-center gap-2 text-[12.5px] text-ash">
                <Lock size={13} /> Lignes reprises du {initial?.type === "avoir" ? "document d'origine" : "devis"} — non modifiables ici.
              </p>
              <div className="divide-y divide-line-soft rounded-xl border border-line">
                {lines.map((l) => (
                  <div key={l.id} className="flex items-start justify-between gap-3 px-4 py-3 text-[13.5px]">
                    <div className="min-w-0">
                      <div className="font-semibold">{l.label}</div>
                      {l.description && <div className="text-[12px] text-ash">{l.description}</div>}
                    </div>
                    <div className="whitespace-nowrap text-right tabular-nums">
                      <div className="text-[12px] text-ash">
                        {l.quantity} × {formatEuro(l.unitPriceHt)}
                      </div>
                      <div className="font-semibold">{formatEuro(lineHt(l))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="rounded-xl border border-line bg-paper/40 p-3 sm:p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-[11px] font-semibold text-ash">Désignation</label>
                          <input
                            value={line.label}
                            onChange={(e) => patchLine(line.id, { label: e.target.value })}
                            placeholder="Kit joueur personnalisé FC Littoral"
                            className={FIELD}
                          />
                        </div>
                        <div className="flex flex-col justify-end gap-0.5 pb-0.5">
                          <IconBtn title="Monter" onClick={() => moveLine(index, -1)} disabled={index === 0}>
                            <ChevronUp size={14} />
                          </IconBtn>
                          <IconBtn title="Descendre" onClick={() => moveLine(index, 1)} disabled={index === lines.length - 1}>
                            <ChevronDown size={14} />
                          </IconBtn>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-ash">Description</label>
                        <textarea
                          value={line.description}
                          rows={1}
                          onChange={(e) => patchLine(line.id, { description: e.target.value })}
                          placeholder="Maillot + short · design FC Littoral · numérotation personnalisée"
                          className={cn(FIELD, "resize-y")}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-ash">Quantité</label>
                          <NumberInput value={line.quantity} step="1" onChange={(v) => patchLine(line.id, { quantity: v })} ariaLabel="Quantité" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-ash">Prix unitaire{vatExempt ? "" : " HT"} (€)</label>
                          <NumberInput value={line.unitPriceHt} onChange={(v) => patchLine(line.id, { unitPriceHt: v })} ariaLabel="Prix unitaire" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-ash">Remise</label>
                          <div className="flex">
                            <NumberInput
                              value={line.discountValue}
                              onChange={(v) => patchLine(line.id, { discountValue: v })}
                              className="rounded-r-none"
                              ariaLabel="Remise de ligne"
                            />
                            <select
                              value={line.discountType}
                              onChange={(e) => patchLine(line.id, { discountType: e.target.value as DiscountType })}
                              className="rounded-field rounded-l-none border-[1.5px] border-l-0 border-line bg-white px-1.5 text-[13px]"
                              aria-label="Type de remise"
                            >
                              <option value="percent">%</option>
                              <option value="amount">€</option>
                            </select>
                          </div>
                        </div>
                        {!vatExempt && (
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-[11px] font-semibold text-ash">TVA</label>
                            <select
                              value={line.vatRate}
                              onChange={(e) => patchLine(line.id, { vatRate: parseFloat(e.target.value) })}
                              className={FIELD}
                            >
                              {VAT_RATES.map((r) => (
                                <option key={r} value={r}>
                                  {r} %
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className={cn("col-span-2 flex items-end justify-between gap-2", vatExempt ? "sm:col-span-4" : "sm:col-span-2")}>
                          <div>
                            <div className="mb-1 text-[11px] font-semibold text-ash">Montant</div>
                            <div className="py-2 text-[15px] font-bold tabular-nums">{formatEuro(lineHt(line))}</div>
                          </div>
                          <div className="flex gap-0.5 pb-1">
                            <IconBtn title="Enregistrer comme produit" onClick={() => saveTemplate(line)}>
                              <Star size={15} />
                            </IconBtn>
                            <IconBtn
                              title="Supprimer la ligne"
                              danger
                              onClick={() => setLines((ls) => ls.filter((l) => l.id !== line.id))}
                              disabled={lines.length === 1}
                            >
                              <Trash2 size={15} />
                            </IconBtn>
                          </div>
                        </div>
                      </div>
                      {line.quantity > 0 && line.unitPriceHt > 0 && (
                        <div className="text-[11.5px] text-ash tabular-nums">
                          {line.quantity} × {formatEuro(line.unitPriceHt)}
                          {line.discountValue > 0 ? ` − ${formatDiscount(line.discountType, line.discountValue)}` : ""} ={" "}
                          <span className="font-semibold text-ink">{formatEuro(lineHt(line))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLines((ls) => [...ls, newLine(vatExempt)])}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-sharp border border-dashed border-line px-4 py-3 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green sm:w-auto"
              >
                <Plus size={15} /> Ajouter une ligne
              </button>
            </>
          )}
        </Section>

        {/* ACOMPTE & LIVRAISON (devis) */}
        {isQuote && (
          <Section title="Acompte & livraison">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL}>Acompte demandé</label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["none", "Aucun acompte"],
                      ["percent", "En %"],
                      ["amount", "Montant en €"],
                    ] as [DepositType, string][]
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setDepositType(v);
                        if (v === "percent" && (!depositValue || depositValue > 100)) setDepositValue(defaults.depositPercent || 50);
                      }}
                      className={cn(
                        "rounded-sharp border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                        depositType === v ? "border-green bg-green text-white" : "border-line text-slate hover:border-green",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                  {depositType !== "none" && (
                    <div className="w-32">
                      <NumberInput
                        value={depositValue}
                        max={depositType === "percent" ? 100 : undefined}
                        onChange={setDepositValue}
                        ariaLabel={depositType === "percent" ? "Acompte en %" : "Acompte en €"}
                      />
                    </div>
                  )}
                </div>
                {depositType !== "none" && (
                  <p className="mt-2 text-[12.5px] text-slate tabular-nums">
                    Acompte : <strong>{formatEuro(amounts.deposit)}</strong> · Solde : <strong>{formatEuro(amounts.balance)}</strong>
                  </p>
                )}
              </div>
              <Field
                label="Délai de livraison prévisionnel"
                value={deliveryLeadTime}
                onChange={setDeliveryLeadTime}
                placeholder="4 à 6 semaines après validation du BAT"
              />
              <Field
                label="Date de livraison prévisionnelle"
                type="date"
                value={plannedDeliveryDate}
                onChange={setPlannedDeliveryDate}
                hint="Prévisionnelle : la date réelle se saisit à la livraison."
              />
            </div>
          </Section>
        )}

        <Section title="Conditions & notes">
          <div className="flex flex-col gap-4">
            <TextArea label="Conditions de paiement" value={paymentTerms} onChange={setPaymentTerms} rows={2} />
            <TextArea label="Notes (visibles sur le PDF)" value={notes} onChange={setNotes} rows={2} placeholder="Conception graphique et numérotation incluses. Livraison offerte." />
            <TextArea
              label="Commentaire interne"
              hint="Jamais visible sur le PDF ni par le client."
              value={internalComments}
              onChange={setInternalComments}
              rows={2}
            />
          </div>
        </Section>
      </div>

      {/* COLONNE DROITE */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <Section title={isQuote ? "Devis" : initial?.type === "avoir" ? "Avoir" : isDeposit ? "Facture d'acompte" : "Facture"}>
          <div className="flex flex-col gap-4">
            <div className="rounded-field bg-paper px-3 py-2 text-[12.5px] text-stone">
              {isQuote
                ? initial?.number
                  ? <span className="font-mono text-[14px] font-bold text-ink">{initial.number}</span>
                  : "Numéro attribué à l'enregistrement (DEV-…)."
                : "Numéro définitif attribué à l'émission. La date de facture sera la date d'émission."}
            </div>
            {isQuote ? (
              <>
                <Field label="Date du devis" type="date" value={date} onChange={(v) => setDate(v || today)} />
                <div>
                  <label className={LABEL}>Durée de validité (jours)</label>
                  <NumberInput value={validityDays} step="1" min={1} onChange={(v) => setValidityDays(Math.max(1, Math.round(v)))} />
                  <p className="mt-1 text-[11.5px] text-ash">Valable jusqu&apos;au {frDate(validUntil)}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={LABEL}>Délai de paiement (jours)</label>
                  <NumberInput value={dueDelay} step="1" onChange={(v) => setDueDelay(Math.max(0, Math.round(v)))} />
                  <p className="mt-1 text-[11.5px] text-ash">
                    {dueDelay === 0 ? "Échéance : à réception" : `Échéance : ${dueDelay} jours après émission`}
                  </p>
                </div>
                {initial?.type !== "avoir" && (
                  <>
                    <Field
                      label="Date de livraison réelle"
                      type="date"
                      value={deliveryDate}
                      onChange={setDeliveryDate}
                      hint="Date à laquelle la marchandise a effectivement été livrée."
                    />
                    <div>
                      <label className={LABEL}>Mode de paiement</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={FIELD}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {PAYMENT_METHOD_LABEL[m]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </Section>

        <Section title="Totaux">
          <div className="flex flex-col gap-2.5 text-[14px]">
            <Row label="Sous-total" value={formatEuro(amounts.subtotal)} />
            {!linesLocked ? (
              <>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={globalDiscountLabel}
                      onChange={(e) => setGlobalDiscountLabel(e.target.value)}
                      className="min-w-0 flex-1 border-b border-dashed border-line bg-transparent py-1 text-[13.5px] text-slate outline-none focus:border-green"
                      aria-label="Libellé de la remise"
                    />
                    <div className="flex w-[124px]">
                      <NumberInput value={globalDiscountValue} onChange={setGlobalDiscountValue} className="rounded-r-none py-2 text-right" ariaLabel="Remise globale" />
                      <select
                        value={globalDiscountType}
                        onChange={(e) => setGlobalDiscountType(e.target.value as DiscountType)}
                        className="rounded-field rounded-l-none border-[1.5px] border-l-0 border-line bg-white px-1.5 text-[13px]"
                        aria-label="Type de remise globale"
                      >
                        <option value="percent">%</option>
                        <option value="amount">€</option>
                      </select>
                    </div>
                  </div>
                  {amounts.globalDiscount > 0 && (
                    <div className="mt-1 text-right text-[13px] font-semibold text-green tabular-nums">−{formatEuro(amounts.globalDiscount)}</div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate">Frais de livraison</span>
                  <div className="w-[124px]">
                    <NumberInput value={shipping} onChange={setShipping} className="py-2 text-right" ariaLabel="Frais de livraison" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {amounts.globalDiscount > 0 && <Row label={globalDiscountLabel} value={`−${formatEuro(amounts.globalDiscount)}`} green />}
                {amounts.shipping > 0 && <Row label="Frais de livraison" value={formatEuro(amounts.shipping)} />}
              </>
            )}
            {!vatExempt && (
              <>
                <Row label="Total HT" value={formatEuro(amounts.totalHt)} />
                {Object.entries(amounts.vatByRate).map(([r, v]) => (
                  <Row key={r} label={`TVA ${r} %`} value={formatEuro(v)} muted />
                ))}
              </>
            )}
            <Row label={vatExempt ? "Total" : "Total TTC"} value={formatEuro(amounts.totalTtc)} strong />
            {vatExempt && <p className="text-right text-[11.5px] font-semibold text-slate">{defaults.vatMention}</p>}

            {isDeposit && (
              <div className="mt-1 flex items-center justify-between gap-2 border-t border-line pt-3">
                <span className="font-semibold">Montant de l&apos;acompte</span>
                <div className="w-[124px]">
                  <NumberInput value={depositAmount} onChange={setDepositAmount} className="py-2 text-right" ariaLabel="Montant de l'acompte" />
                </div>
              </div>
            )}
            {(initial?.deductions ?? []).map((d, i) => (
              <Row key={i} label={`${d.label}${d.number ? ` (${d.number})` : ""}`} value={`−${formatEuro(d.amount)}`} green />
            ))}
            {isQuote && depositType !== "none" && (
              <>
                <Row label="Acompte demandé" value={formatEuro(amounts.deposit)} muted />
                <Row label="Solde" value={formatEuro(amounts.balance)} muted />
              </>
            )}
            <div className="mt-1 flex items-center justify-between rounded-xl bg-green px-4 py-3 text-white">
              <span className="text-[11px] font-semibold uppercase tracking-caps">
                {isQuote ? "Total devis" : isDeposit ? "Acompte à payer" : initial?.type === "avoir" ? "Montant de l'avoir" : "Net à payer"}
              </span>
              <span className="text-[19px] font-extrabold tabular-nums">{formatEuro(amounts.amountDue)}</span>
            </div>
          </div>
        </Section>

        <ErrorNote>{error}</ErrorNote>

        <div className="flex gap-3">
          <button type="button" onClick={submit} disabled={saving} className={cn(BTN_PRIMARY, "flex-1 py-3.5")}>
            <Save size={16} />
            {saving ? "Enregistrement…" : initial ? "Enregistrer" : isQuote ? "Créer le devis" : "Créer le brouillon"}
          </button>
          <Link href={cancelHref} className={cn(BTN, "py-3.5")}>
            Annuler
          </Link>
        </div>
      </div>

      {showNewClient && (
        <QuickClientDialog
          onClose={() => setShowNewClient(false)}
          onCreated={(c) => {
            setClients((cs) => [c, ...cs]);
            setClientId(c.id);
            setShowNewClient(false);
          }}
        />
      )}
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors disabled:opacity-30",
        danger ? "hover:bg-white hover:text-danger" : "hover:bg-white hover:text-green",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value, strong, muted, green }: { label: string; value: string; strong?: boolean; muted?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn(muted ? "text-ash" : "text-slate", strong && "font-bold text-ink", green && "text-green")}>{label}</span>
      <span
        className={cn(
          "whitespace-nowrap tabular-nums",
          strong ? "text-[17px] font-extrabold" : muted ? "text-ash" : "font-semibold",
          green && "text-green",
        )}
      >
        {value}
      </span>
    </div>
  );
}

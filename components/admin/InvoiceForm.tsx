"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Save, Star, Trash2 } from "lucide-react";
import {
  createClientAction,
  createInvoiceAction,
  saveProductTemplateAction,
  updateInvoiceAction,
} from "@/app/actions/billing";
import { computeTotals, formatEuro, lineHt } from "@/lib/billing/calc";
import { company, companyAddressLine } from "@/lib/settings/company";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABEL,
  type Client,
  type Invoice,
  type InvoiceLine,
  type ProductTemplate,
} from "@/lib/billing/types";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-ink";
const VAT_RATES = [20, 10, 5.5, 0];

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function newLine(): InvoiceLine {
  return {
    id: crypto.randomUUID(),
    label: "",
    quantity: 1,
    unitPriceHt: 0,
    vatRate: 20,
    discountType: "amount",
    discountValue: 0,
  };
}

const emptyClient = {
  club: "",
  contact: "",
  address: "",
  city: "",
  zip: "",
  country: "France",
  phone: "",
  email: "",
};

export function InvoiceForm({
  mode,
  initial,
  clients: initialClients,
  templates: initialTemplates,
  preselectClient,
}: {
  mode: "create" | "edit";
  initial?: Invoice;
  clients: Client[];
  templates: ProductTemplate[];
  preselectClient?: Client;
}) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [templates, setTemplates] = useState(initialTemplates);

  const preselectSnapshot = preselectClient
    ? {
        club: preselectClient.club,
        contact: preselectClient.contact,
        address: preselectClient.address,
        city: preselectClient.city,
        zip: preselectClient.zip,
        country: preselectClient.country,
        phone: preselectClient.phone,
        email: preselectClient.email,
      }
    : null;

  const [clientId, setClientId] = useState<string | null>(
    initial?.clientId ?? preselectClient?.id ?? null,
  );
  const [client, setClient] = useState({
    ...emptyClient,
    ...(initial?.client ?? preselectSnapshot ?? {}),
  });
  const [date, setDate] = useState(initial?.date ?? today());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? plusDays(30));
  const [projectRef, setProjectRef] = useState(initial?.projectRef ?? "");
  const [internalRef, setInternalRef] = useState(initial?.internalRef ?? "");
  const [status, setStatus] = useState(initial?.status ?? "brouillon");
  const [lines, setLines] = useState<InvoiceLine[]>(initial?.lines?.length ? initial.lines : [newLine()]);
  const [shipping, setShipping] = useState(initial?.shipping ?? 0);
  const [globalDiscountType, setGlobalDiscountType] = useState(initial?.globalDiscountType ?? "amount");
  const [globalDiscountValue, setGlobalDiscountValue] = useState(initial?.globalDiscountValue ?? 0);
  const [deposit, setDeposit] = useState(initial?.deposit ?? 0);
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? company.defaultPaymentTerms);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [internalComments, setInternalComments] = useState(initial?.internalComments ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => computeTotals({ lines, shipping, globalDiscountType, globalDiscountValue, deposit }),
    [lines, shipping, globalDiscountType, globalDiscountValue, deposit],
  );

  const patchLine = (id: string, patch: Partial<InvoiceLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((ls) => ls.filter((l) => l.id !== id));

  const selectClient = (id: string) => {
    if (id === "new") {
      setClientId(null);
      setClient(emptyClient);
      return;
    }
    const c = clients.find((x) => x.id === id);
    if (c) {
      setClientId(c.id);
      setClient({
        club: c.club,
        contact: c.contact,
        address: c.address,
        city: c.city,
        zip: c.zip,
        country: c.country,
        phone: c.phone,
        email: c.email,
      });
    }
  };

  const saveClient = async () => {
    if (!client.club.trim()) {
      setError("Renseignez au moins le nom du club avant d'enregistrer le client.");
      return;
    }
    const saved = await createClientAction(client);
    setClients((cs) => [saved, ...cs]);
    setClientId(saved.id);
    setError(null);
  };

  const insertTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setLines((ls) => [
      ...ls,
      { ...newLine(), label: t.label, unitPriceHt: t.unitPriceHt, vatRate: t.vatRate },
    ]);
  };

  const saveLineAsTemplate = async (line: InvoiceLine) => {
    if (!line.label.trim()) {
      setError("Donnez un libellé à la ligne avant de l'enregistrer comme modèle.");
      return;
    }
    const tpl = await saveProductTemplateAction({
      label: line.label,
      unitPriceHt: line.unitPriceHt,
      vatRate: line.vatRate,
    });
    setTemplates((ts) => [tpl, ...ts]);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (!client.club.trim()) {
      setError("Le nom du club est requis.");
      return;
    }
    if (lines.length === 0 || lines.every((l) => !l.label.trim())) {
      setError("Ajoutez au moins une ligne de produit.");
      return;
    }
    setSaving(true);

    // Nouveau client → on crée sa fiche CRM et on relie la facture.
    let linkedClientId = clientId;
    if (!linkedClientId && client.club.trim()) {
      try {
        const saved = await createClientAction(client);
        linkedClientId = saved.id;
      } catch {
        /* non bloquant : la facture garde le client figé */
      }
    }

    const input = {
      documentType: "facture" as const,
      client,
      clientId: linkedClientId,
      date,
      dueDate,
      projectRef,
      internalRef,
      status,
      lines: lines.filter((l) => l.label.trim() || l.unitPriceHt),
      shipping,
      globalDiscountType,
      globalDiscountValue,
      deposit,
      paymentTerms,
      notes,
      internalComments,
    };
    const result =
      mode === "edit" && initial
        ? await updateInvoiceAction(initial.id, input)
        : await createInvoiceAction(input);
    setSaving(false);
    if (result.ok && result.id) router.push(`/admin/factures/${result.id}`);
    else setError(result.error ?? "Erreur d'enregistrement.");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {/* CLIENT */}
        <Section title="Client">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Client enregistré</label>
              <select
                value={clientId ?? "new"}
                onChange={(e) => selectClient(e.target.value)}
                className={FIELD}
              >
                <option value="new">+ Nouveau client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.club}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={saveClient}
                className="rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
              >
                Enregistrer ce client
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom du club" value={client.club} onChange={(v) => setClient({ ...client, club: v })} />
            <Field label="Responsable" value={client.contact} onChange={(v) => setClient({ ...client, contact: v })} />
            <Field label="Adresse" value={client.address} onChange={(v) => setClient({ ...client, address: v })} className="sm:col-span-2" />
            <Field label="Ville" value={client.city} onChange={(v) => setClient({ ...client, city: v })} />
            <Field label="Code postal" value={client.zip} onChange={(v) => setClient({ ...client, zip: v })} />
            <Field label="Pays" value={client.country} onChange={(v) => setClient({ ...client, country: v })} />
            <Field label="Téléphone" value={client.phone} onChange={(v) => setClient({ ...client, phone: v })} />
            <Field label="Email" type="email" value={client.email} onChange={(v) => setClient({ ...client, email: v })} className="sm:col-span-2" />
          </div>
        </Section>

        {/* PRODUITS */}
        <Section title="Produits">
          {templates.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-ash">Insérer un modèle :</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) insertTemplate(e.target.value);
                  e.target.value = "";
                }}
                className="rounded-field border-[1.5px] border-line bg-white px-3 py-2 text-[13px]"
              >
                <option value="">Choisir…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {formatEuro(t.unitPriceHt)} HT
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {lines.map((line, index) => (
              <div key={line.id} className="rounded-xl border border-line bg-paper/40 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                  <div className="sm:col-span-12 lg:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold text-ash">Libellé</label>
                    <input
                      value={line.label}
                      onChange={(e) => patchLine(line.id, { label: e.target.value })}
                      placeholder="Maillot domicile personnalisé"
                      className={FIELD}
                    />
                  </div>
                  <NumCell label="Qté" value={line.quantity} onChange={(v) => patchLine(line.id, { quantity: v })} className="sm:col-span-2 lg:col-span-1" />
                  <NumCell label="PU HT" value={line.unitPriceHt} onChange={(v) => patchLine(line.id, { unitPriceHt: v })} step="0.01" className="sm:col-span-3 lg:col-span-2" />
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold text-ash">TVA</label>
                    <select
                      value={line.vatRate}
                      onChange={(e) => patchLine(line.id, { vatRate: parseFloat(e.target.value) })}
                      className={FIELD}
                    >
                      {VAT_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3 lg:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold text-ash">Remise</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={line.discountValue || ""}
                        onChange={(e) => patchLine(line.id, { discountValue: parseFloat(e.target.value) || 0 })}
                        className={cn(FIELD, "rounded-r-none")}
                      />
                      <select
                        value={line.discountType}
                        onChange={(e) => patchLine(line.id, { discountType: e.target.value as "amount" | "percent" })}
                        className="rounded-field rounded-l-none border-[1.5px] border-l-0 border-line bg-white px-1.5 text-[13px]"
                      >
                        <option value="amount">€</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end justify-between sm:col-span-2 lg:col-span-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-ash">Total HT</label>
                      <div className="py-2.5 text-[14px] font-bold tabular-nums">{formatEuro(lineHt(line))}</div>
                    </div>
                    <div className="flex gap-0.5 pb-1.5">
                      <button
                        type="button"
                        title="Enregistrer comme modèle"
                        onClick={() => saveLineAsTemplate(line)}
                        className="flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors hover:bg-white hover:text-green"
                      >
                        <Star size={15} />
                      </button>
                      <button
                        type="button"
                        title="Retirer la ligne"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors hover:bg-white hover:text-danger disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-ash">Ligne {index + 1}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLines((ls) => [...ls, newLine()])}
            className="mt-3 flex items-center gap-2 rounded-sharp border border-dashed border-line px-4 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
          >
            <Plus size={15} /> Ajouter une ligne
          </button>
        </Section>

        {/* INFOS COMPLÉMENTAIRES */}
        <Section title="Informations complémentaires">
          <div className="flex flex-col gap-4">
            <div>
              <label className={LABEL}>Conditions de paiement</label>
              <textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={cn(FIELD, "min-h-16 resize-y")} />
            </div>
            <div>
              <label className={LABEL}>Notes (visibles sur le PDF)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(FIELD, "min-h-16 resize-y")} />
            </div>
            <div>
              <label className={LABEL}>
                Commentaires internes <span className="font-normal text-ash">(jamais sur le PDF)</span>
              </label>
              <textarea value={internalComments} onChange={(e) => setInternalComments(e.target.value)} className={cn(FIELD, "min-h-16 resize-y")} />
            </div>
          </div>
        </Section>
      </div>

      {/* COLONNE DROITE */}
      <div className="flex flex-col gap-6">
        <Section title="Facture">
          <div className="flex flex-col gap-4">
            {mode === "edit" && initial && (
              <div className="rounded-field bg-paper px-3 py-2 font-mono text-[14px] font-bold">
                {initial.number}
              </div>
            )}
            {mode === "create" && (
              <div className="rounded-field bg-paper px-3 py-2 text-[12px] text-ash">
                Numéro attribué automatiquement (LEM-{new Date(date).getFullYear()}-…)
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>Échéance</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={FIELD} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Référence / Projet</label>
              <input
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                placeholder="FC Littoral — Équipement Senior 2026/2027"
                className={FIELD}
              />
            </div>
            <Field label="Référence interne" value={internalRef} onChange={setInternalRef} />
            <div>
              <label className={LABEL}>Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={FIELD}>
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {INVOICE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* TOTAUX */}
        <Section title="Totaux">
          <div className="flex flex-col gap-2 text-[14px]">
            <Row label="Total HT" value={formatEuro(totals.linesHt)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate">Remise globale</span>
              <div className="flex w-[130px]">
                <input
                  type="number"
                  value={globalDiscountValue || ""}
                  onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                  className={cn(FIELD, "rounded-r-none text-right")}
                />
                <select
                  value={globalDiscountType}
                  onChange={(e) => setGlobalDiscountType(e.target.value as "amount" | "percent")}
                  className="rounded-field rounded-l-none border-[1.5px] border-l-0 border-line bg-white px-1.5 text-[13px]"
                >
                  <option value="amount">€</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate">Frais de livraison</span>
              <input
                type="number"
                value={shipping || ""}
                step="0.01"
                onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                className={cn(FIELD, "w-[130px] text-right")}
              />
            </div>
            {Object.entries(totals.vatByRate).map(([rate, amount]) => (
              <Row key={rate} label={`TVA ${rate}%`} value={formatEuro(amount)} muted />
            ))}
            <Row label="Total TTC" value={formatEuro(totals.totalTtc)} strong />
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate">Acompte payé</span>
              <input
                type="number"
                value={deposit || ""}
                step="0.01"
                onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                className={cn(FIELD, "w-[130px] text-right")}
              />
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-line pt-2">
              <span className="font-bold">Reste à payer</span>
              <span className="text-[18px] font-extrabold tabular-nums text-green">
                {formatEuro(totals.remaining)}
              </span>
            </div>
          </div>
        </Section>

        {/* ÉMETTEUR */}
        <div className="rounded-2xl border border-line bg-paper px-5 py-4 text-[12px] leading-[1.6] text-stone">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-caps text-ash">Émetteur</div>
          <div className="font-bold text-ink">{company.name}</div>
          <div>{companyAddressLine()}</div>
          <div>{company.email}</div>
          <div className="mt-1 text-[11px] text-ash">Récupéré automatiquement des paramètres.</div>
        </div>

        {error && (
          <p className="rounded-field border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-sharp bg-green py-3.5 text-[14px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Enregistrement…" : mode === "edit" ? "Enregistrer" : "Créer la facture"}
          </button>
          <Link
            href="/admin/factures"
            className="flex items-center rounded-sharp border border-line px-4 py-3.5 text-[14px] font-semibold text-slate transition-colors hover:border-ink"
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <h2 className="mb-4 text-[15px] font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} />
    </div>
  );
}

function NumCell({
  label,
  value,
  onChange,
  step,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold text-ash">{label}</label>
      <input
        type="number"
        step={step}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={FIELD}
      />
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(muted ? "text-ash" : "text-slate", strong && "font-bold text-ink")}>{label}</span>
      <span className={cn("tabular-nums", strong ? "text-[16px] font-extrabold" : muted ? "text-ash" : "font-semibold")}>
        {value}
      </span>
    </div>
  );
}

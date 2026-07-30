"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save } from "lucide-react";
import { createOrderAction, updateOrderAction } from "@/app/actions/orders";
import type { Order, OrderInput } from "@/lib/orders/types";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-ink";

/** Options légères transmises par la page (composant serveur). */
export interface ClientOption {
  id: string;
  club: string;
}
export interface InvoiceOption {
  id: string;
  number: string;
  clientName: string;
}

const empty: OrderInput = {
  clientId: null,
  clientName: "",
  title: "",
  sport: "",
  quantity: "",
  dueDate: "",
  invoiceId: null,
  notes: "",
};

export function OrderForm({
  mode,
  clients,
  invoices,
  initial,
  presetClientId,
}: {
  mode: "create" | "edit";
  clients: ClientOption[];
  invoices: InvoiceOption[];
  initial?: Order;
  presetClientId?: string;
}) {
  const router = useRouter();

  const preset = presetClientId ? clients.find((c) => c.id === presetClientId) : undefined;
  const [f, setF] = useState<OrderInput>({
    ...empty,
    ...(initial
      ? {
          clientId: initial.clientId,
          clientName: initial.clientName,
          title: initial.title,
          sport: initial.sport,
          quantity: initial.quantity,
          dueDate: initial.dueDate,
          invoiceId: initial.invoiceId,
          notes: initial.notes,
        }
      : preset
        ? { clientId: preset.id, clientName: preset.club }
        : {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof OrderInput>(k: K, v: OrderInput[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const onSelectClient = (id: string) => {
    if (!id) {
      set("clientId", null);
      return;
    }
    const club = clients.find((c) => c.id === id)?.club ?? "";
    setF((prev) => ({ ...prev, clientId: id, clientName: club || prev.clientName }));
  };

  const submit = async () => {
    setError(null);
    if (!f.clientName.trim()) {
      setError("Le nom du client est requis.");
      return;
    }
    if (!f.title.trim()) {
      setError("Le libellé de la commande est requis.");
      return;
    }
    setSaving(true);
    const result =
      mode === "edit" && initial
        ? await updateOrderAction(initial.id, f)
        : await createOrderAction(f);
    setSaving(false);
    if (result.ok && result.id) router.push(`/admin/commandes/${result.id}`);
    else setError(result.error ?? "Erreur d'enregistrement.");
  };

  // Factures proposées : celles du client lié en tête, puis les autres.
  const invoiceOptions = f.clientId
    ? [...invoices].sort((a, b) => {
        const an = a.clientName.trim().toLowerCase() === f.clientName.trim().toLowerCase() ? 0 : 1;
        const bn = b.clientName.trim().toLowerCase() === f.clientName.trim().toLowerCase() ? 0 : 1;
        return an - bn || b.number.localeCompare(a.number);
      })
    : invoices;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Client">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fiche client liée (optionnel)</label>
            <select value={f.clientId ?? ""} onChange={(e) => onSelectClient(e.target.value)} className={FIELD}>
              <option value="">— Aucune (saisie libre) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.club}
                </option>
              ))}
            </select>
          </div>
          <Field label="Nom du client" value={f.clientName} onChange={(v) => set("clientName", v)} />
        </div>
      </Section>

      <Section title="Commande">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Libellé de la commande"
            value={f.title}
            onChange={(v) => set("title", v)}
            placeholder="FC Littoral — Équipement Senior 2026/2027"
            className="sm:col-span-2"
          />
          <Field label="Sport / discipline" value={f.sport} onChange={(v) => set("sport", v)} />
          <Field label="Quantité" value={f.quantity} onChange={(v) => set("quantity", v)} placeholder="30 maillots + 30 shorts" />
          <div>
            <label className={LABEL}>Livraison prévue</label>
            <input
              type="date"
              value={f.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Facture liée (optionnel)</label>
            <select
              value={f.invoiceId ?? ""}
              onChange={(e) => set("invoiceId", e.target.value || null)}
              className={FIELD}
            >
              <option value="">— Aucune —</option>
              {invoiceOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.number} — {i.clientName || "—"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Notes internes">
        <textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Contraintes, préférences, détails de production…"
          className={cn(FIELD, "min-h-24 resize-y")}
        />
      </Section>

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
          className="flex items-center gap-2 rounded-sharp bg-green px-6 py-3 text-[14px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Enregistrement…" : mode === "edit" ? "Enregistrer" : "Créer la commande"}
        </button>
        <Link
          href={mode === "edit" && initial ? `/admin/commandes/${initial.id}` : "/admin/commandes"}
          className="flex items-center rounded-sharp border border-line px-4 py-3 text-[14px] font-semibold text-slate transition-colors hover:border-ink"
        >
          Annuler
        </Link>
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
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={FIELD} />
    </div>
  );
}

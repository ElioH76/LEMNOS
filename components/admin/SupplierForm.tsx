"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Save, X } from "lucide-react";
import { createSupplierAction, updateSupplierAction } from "@/app/actions/suppliers";
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_CATEGORY_LABEL,
  type Supplier,
  type SupplierCategory,
  type SupplierInput,
} from "@/lib/suppliers/types";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-ink";

const empty: SupplierInput = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  zip: "",
  country: "France",
  category: "textile",
  products: [],
  notes: "",
};

export function SupplierForm({ mode, initial }: { mode: "create" | "edit"; initial?: Supplier }) {
  const router = useRouter();
  const [f, setF] = useState<SupplierInput>({
    ...empty,
    ...(initial
      ? {
          name: initial.name,
          contact: initial.contact,
          email: initial.email,
          phone: initial.phone,
          website: initial.website,
          address: initial.address,
          city: initial.city,
          zip: initial.zip,
          country: initial.country,
          category: initial.category,
          products: initial.products,
          notes: initial.notes,
        }
      : {}),
  });
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SupplierInput>(k: K, v: SupplierInput[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const addProduct = () => {
    const v = draft.trim();
    if (v && !f.products.includes(v)) set("products", [...f.products, v]);
    setDraft("");
  };
  const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addProduct();
    }
  };

  const submit = async () => {
    setError(null);
    if (!f.name.trim()) {
      setError("Le nom du fournisseur est requis.");
      return;
    }
    setSaving(true);
    const result =
      mode === "edit" && initial
        ? await updateSupplierAction(initial.id, f)
        : await createSupplierAction(f);
    setSaving(false);
    if (result.ok && result.id) router.push(`/admin/fournisseurs/${result.id}`);
    else setError(result.error ?? "Erreur d'enregistrement.");
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title="Identité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom du fournisseur" value={f.name} onChange={(v) => set("name", v)} className="sm:col-span-2" />
          <Field label="Contact principal" value={f.contact} onChange={(v) => set("contact", v)} />
          <div>
            <label className={LABEL}>Catégorie</label>
            <select
              value={f.category}
              onChange={(e) => set("category", e.target.value as SupplierCategory)}
              className={FIELD}
            >
              {SUPPLIER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {SUPPLIER_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <Field label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
          <Field label="Téléphone" value={f.phone} onChange={(v) => set("phone", v)} />
          <Field label="Site web" value={f.website} onChange={(v) => set("website", v)} placeholder="https://…" className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Adresse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Adresse" value={f.address} onChange={(v) => set("address", v)} className="sm:col-span-2" />
          <Field label="Ville" value={f.city} onChange={(v) => set("city", v)} />
          <Field label="Code postal" value={f.zip} onChange={(v) => set("zip", v)} />
          <Field label="Pays" value={f.country} onChange={(v) => set("country", v)} />
        </div>
      </Section>

      <Section title="Produits & prestations">
        <div className="flex flex-wrap items-center gap-2">
          {f.products.map((p) => (
            <span key={p} className="flex items-center gap-1.5 rounded-pill border border-line py-1 pl-3 pr-2">
              <span className="text-[12.5px]">{p}</span>
              <button
                type="button"
                onClick={() => set("products", f.products.filter((x) => x !== p))}
                className="text-ash transition-colors hover:text-danger"
                aria-label={`Retirer ${p}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onDraftKey}
              placeholder="Maillots, flocage, shorts…"
              className="rounded-field border-[1.5px] border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-green"
            />
            <button
              type="button"
              onClick={addProduct}
              className="flex items-center gap-1 rounded-sharp border border-dashed border-line px-3 py-2 text-[12px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
            >
              <Plus size={13} /> Ajouter
            </button>
          </span>
        </div>
      </Section>

      <Section title="Notes internes">
        <textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Conditions, délais, minimums de commande, qualité…"
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
          {saving ? "Enregistrement…" : mode === "edit" ? "Enregistrer" : "Créer le fournisseur"}
        </button>
        <Link
          href={mode === "edit" && initial ? `/admin/fournisseurs/${initial.id}` : "/admin/fournisseurs"}
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
  type = "text",
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={FIELD} />
    </div>
  );
}

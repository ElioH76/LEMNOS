"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Save, X } from "lucide-react";
import { createClientProfileAction, updateClientAction } from "@/app/actions/clients";
import type { Client } from "@/lib/billing/types";
import { cn } from "@/lib/cn";
import { LogoUpload } from "./LogoUpload";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-ink";

const empty = {
  club: "",
  contact: "",
  address: "",
  city: "",
  zip: "",
  country: "France",
  phone: "",
  email: "",
  logoUrl: "",
  notes: "",
};

export function ClientForm({
  mode,
  initial,
  blobEnabled = false,
}: {
  mode: "create" | "edit";
  initial?: Client;
  blobEnabled?: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState({ ...empty, ...(initial ?? {}) });
  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [draftColor, setDraftColor] = useState("#1E5B3C");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof empty, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const addColor = () => {
    if (!colors.includes(draftColor)) setColors((c) => [...c, draftColor]);
  };

  const submit = async () => {
    setError(null);
    if (!f.club.trim()) {
      setError("Le nom du club ou de l'entreprise est requis.");
      return;
    }
    setSaving(true);
    const input = { ...f, colors };
    const result =
      mode === "edit" && initial
        ? await updateClientAction(initial.id, input)
        : await createClientProfileAction(input);
    setSaving(false);
    if (result.ok && result.id) router.push(`/admin/clients/${result.id}`);
    else setError(result.error ?? "Erreur d'enregistrement.");
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title="Identité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom du club / entreprise" value={f.club} onChange={(v) => set("club", v)} className="sm:col-span-2" />
          <Field label="Contact principal" value={f.contact} onChange={(v) => set("contact", v)} />
          <Field label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
          <Field label="Téléphone" value={f.phone} onChange={(v) => set("phone", v)} />
          <div className="sm:col-span-2">
            <label className={LABEL}>Logo (optionnel)</label>
            <LogoUpload
              value={f.logoUrl}
              onChange={(v) => set("logoUrl", v)}
              blobEnabled={blobEnabled}
            />
          </div>
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

      <Section title="Couleurs principales">
        <div className="flex flex-wrap items-center gap-2">
          {colors.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-pill border border-line py-1 pl-1.5 pr-2.5">
              <span className="h-5 w-5 rounded-full border border-line" style={{ background: c }} />
              <span className="font-mono text-[12px] uppercase">{c}</span>
              <button
                type="button"
                onClick={() => setColors((cs) => cs.filter((x) => x !== c))}
                className="text-ash transition-colors hover:text-danger"
                aria-label={`Retirer ${c}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <input
              type="color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-line bg-white"
              aria-label="Choisir une couleur"
            />
            <button
              type="button"
              onClick={addColor}
              className="flex items-center gap-1 rounded-sharp border border-dashed border-line px-3 py-1.5 text-[12px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
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
          placeholder="Informations utiles, préférences, historique de la relation…"
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
          {saving ? "Enregistrement…" : mode === "edit" ? "Enregistrer" : "Créer le client"}
        </button>
        <Link
          href={mode === "edit" && initial ? `/admin/clients/${initial.id}` : "/admin/clients"}
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
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
      />
    </div>
  );
}

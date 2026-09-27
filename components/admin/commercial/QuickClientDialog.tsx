"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { quickCreateClientAction } from "@/app/actions/commercial";
import { CLIENT_TYPES, CLIENT_TYPE_LABEL, type Client, type ClientType } from "@/lib/billing/types";
import { BTN, BTN_PRIMARY, ErrorNote, FIELD, Field, LABEL, Modal } from "./ui";

/** Création d'un client sans quitter le formulaire de devis / facture. */
export function QuickClientDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const [f, setF] = useState({
    type: "association" as ClientType,
    club: "",
    contact: "",
    contactRole: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    city: "",
    country: "France",
    siren: "",
    siret: "",
    rna: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!f.club.trim()) return setError("Le nom est requis.");
    setSaving(true);
    const res = await quickCreateClientAction(f);
    setSaving(false);
    if (res.ok && res.client) onCreated(res.client);
    else setError(res.error ?? "Création impossible.");
  };

  return (
    <Modal title="Nouveau client" onClose={onClose} wide>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Type</label>
          <select value={f.type} onChange={(e) => set("type")(e.target.value)} className={FIELD}>
            {CLIENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CLIENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <Field label="Nom / raison sociale" value={f.club} onChange={set("club")} required />
        <Field label="Nom du contact" value={f.contact} onChange={set("contact")} />
        <Field label="Fonction du contact" value={f.contactRole} onChange={set("contactRole")} placeholder="Président, trésorier…" />
        <Field label="Email" type="email" value={f.email} onChange={set("email")} />
        <Field label="Téléphone" value={f.phone} onChange={set("phone")} />
        <Field label="Adresse" value={f.address} onChange={set("address")} className="sm:col-span-2" />
        <Field label="Code postal" value={f.zip} onChange={set("zip")} />
        <Field label="Ville" value={f.city} onChange={set("city")} />
        {f.type === "association" ? (
          <Field label="N° RNA" value={f.rna} onChange={set("rna")} placeholder="W761234567" />
        ) : f.type === "entreprise" ? (
          <Field label="SIRET" value={f.siret} onChange={set("siret")} />
        ) : null}
        {f.type !== "particulier" && <Field label="SIREN" value={f.siren} onChange={set("siren")} />}
      </div>
      <p className="mt-3 text-[12px] text-ash">Les autres informations se complètent ensuite dans la fiche client.</p>
      <div className="mt-4">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={BTN}>
          Annuler
        </button>
        <button type="button" onClick={submit} disabled={saving} className={BTN_PRIMARY}>
          <UserPlus size={15} /> {saving ? "Création…" : "Créer le client"}
        </button>
      </div>
    </Modal>
  );
}

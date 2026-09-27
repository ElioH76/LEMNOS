"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveSettingsAction, setNextNumberAction } from "@/app/actions/commercial";
import { type CommercialSettings, formatNumber } from "@/lib/billing/settings";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/billing/types";
import { LogoUpload } from "../LogoUpload";
import { BTN, BTN_PRIMARY, ErrorNote, FIELD, Field, LABEL, NumberInput, Section, SuccessNote, TextArea } from "./ui";

function useSave<K extends keyof CommercialSettings>(section: K, initial: CommercialSettings[K]) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const set = <F extends keyof CommercialSettings[K]>(k: F) => (v: CommercialSettings[K][F]) => {
    setOk(null);
    setValue((p) => ({ ...p, [k]: v }));
  };
  const save = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    const res = await saveSettingsAction(section, value);
    setSaving(false);
    if (res.ok) {
      setOk(res.message ?? "Enregistré.");
      router.refresh();
    } else setError(res.error ?? "Enregistrement impossible.");
  };
  return { value, set, save, saving, error, ok };
}

function SaveBar({ save, saving, error, ok }: { save: () => void; saving: boolean; error: string | null; ok: string | null }) {
  return (
    <div className="flex flex-col gap-3">
      <ErrorNote>{error}</ErrorNote>
      <SuccessNote>{ok}</SuccessNote>
      <div>
        <button type="button" onClick={save} disabled={saving} className={BTN_PRIMARY}>
          <Save size={15} /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

// ── Entreprise ─────────────────────────────────────────────────────────────

export function CompanyForm({ initial, blobEnabled }: { initial: CommercialSettings["company"]; blobEnabled: boolean }) {
  const s = useSave("company", initial);
  const v = s.value;
  return (
    <div className="flex flex-col gap-6">
      <Section title="Identité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" value={v.name} onChange={s.set("name")} required />
          <Field label="Nom commercial" value={v.tradeName} onChange={s.set("tradeName")} hint="Affiché en grand dans l'en-tête des PDF." />
          <Field label="Dirigeant" value={v.manager} onChange={s.set("manager")} />
          <Field label="Statut juridique" value={v.legalStatus} onChange={s.set("legalStatus")} placeholder="Entrepreneur individuel (EI)" />
          <Field label="Slogan" value={v.slogan} onChange={s.set("slogan")} />
          <Field label="Site web" value={v.website} onChange={s.set("website")} />
        </div>
      </Section>
      <Section title="Coordonnées">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Adresse" value={v.address} onChange={s.set("address")} className="sm:col-span-2" />
          <Field label="Code postal" value={v.zip} onChange={s.set("zip")} />
          <Field label="Ville" value={v.city} onChange={s.set("city")} />
          <Field label="Pays" value={v.country} onChange={s.set("country")} />
          <Field label="Email" type="email" value={v.email} onChange={s.set("email")} hint="Adresse de réponse des emails envoyés." />
          <Field label="Téléphone" value={v.phone} onChange={s.set("phone")} />
        </div>
      </Section>
      <Section title="Informations légales & TVA">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="SIRET" value={v.siret} onChange={s.set("siret")} />
          <Field label="SIREN" value={v.siren} onChange={s.set("siren")} />
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-xl border border-line p-4">
              <input
                type="checkbox"
                checked={v.vatExempt}
                onChange={(e) => s.set("vatExempt")(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1E5B3C]"
              />
              <span className="text-[13.5px]">
                <span className="font-semibold">Franchise en base de TVA</span>
                <span className="block text-[12.5px] text-ash">
                  Aucune TVA n&apos;est facturée et la mention ci-dessous figure sur chaque document. Le régime est figé sur chaque
                  document à sa création.
                </span>
              </span>
            </label>
          </div>
          <Field label="Mention TVA" value={v.vatMention} onChange={s.set("vatMention")} className="sm:col-span-2" />
          {!v.vatExempt && <Field label="N° de TVA intracommunautaire" value={v.tvaIntra} onChange={s.set("tvaIntra")} />}
        </div>
      </Section>
      <Section title="Identité visuelle des documents">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Logo (PNG ou JPG)</label>
            <LogoUpload value={v.logoUrl} onChange={s.set("logoUrl")} blobEnabled={blobEnabled} accept="image/png,image/jpeg" />
            <p className="mt-1 text-[11.5px] text-ash">Vide = emblème LEMNOS officiel (recommandé).</p>
          </div>
          <div>
            <label className={LABEL}>Couleur principale</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(v.primaryColor) ? v.primaryColor : "#1E5B3C"}
                onChange={(e) => s.set("primaryColor")(e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded border border-line bg-white"
                aria-label="Couleur principale"
              />
              <input value={v.primaryColor} onChange={(e) => s.set("primaryColor")(e.target.value)} className={`${FIELD} font-mono`} />
              <button type="button" onClick={() => s.set("primaryColor")("#1E5B3C")} className={BTN}>
                Vert LEMNOS
              </button>
            </div>
          </div>
        </div>
      </Section>
      <SaveBar {...s} />
    </div>
  );
}

// ── Paiement ───────────────────────────────────────────────────────────────

export function BankForm({ initial }: { initial: CommercialSettings["bank"] }) {
  const s = useSave("bank", initial);
  const v = s.value;
  return (
    <div className="flex flex-col gap-6">
      <Section title="Coordonnées bancaires">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Titulaire du compte" value={v.holder} onChange={s.set("holder")} />
          <Field label="Banque" value={v.bank} onChange={s.set("bank")} />
          <Field label="IBAN" value={v.iban} onChange={s.set("iban")} placeholder="FR76 …" className="sm:col-span-2" />
          <Field label="BIC" value={v.bic} onChange={s.set("bic")} />
        </div>
        <p className="mt-4 text-[12.5px] text-ash">
          Ces informations apparaissent automatiquement sur les factures, et sont figées sur chaque facture au moment de son
          émission. Elles ne sont jamais visibles sur le lien d&apos;acceptation public des devis.
        </p>
      </Section>
      <SaveBar {...s} />
    </div>
  );
}

// ── Conditions ─────────────────────────────────────────────────────────────

export function TermsForm({ initial }: { initial: CommercialSettings["terms"] }) {
  const s = useSave("terms", initial);
  const v = s.value;
  return (
    <div className="flex flex-col gap-6">
      <Section title="Valeurs par défaut">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Délai de paiement standard (jours)</label>
            <NumberInput value={v.paymentDelayDays} step="1" onChange={(n) => s.set("paymentDelayDays")(n)} />
            <p className="mt-1 text-[11.5px] text-ash">0 = paiement comptant à réception.</p>
          </div>
          <div>
            <label className={LABEL}>Acompte par défaut (%)</label>
            <NumberInput value={v.defaultDepositPercent} step="1" max={100} onChange={(n) => s.set("defaultDepositPercent")(n)} />
            <p className="mt-1 text-[11.5px] text-ash">0 = aucun acompte proposé.</p>
          </div>
          <div>
            <label className={LABEL}>Validité des devis (jours)</label>
            <NumberInput value={v.quoteValidityDays} step="1" onChange={(n) => s.set("quoteValidityDays")(n)} />
          </div>
          <div>
            <label className={LABEL}>Mode de paiement par défaut</label>
            <select value={v.defaultPaymentMethod} onChange={(e) => s.set("defaultPaymentMethod")(e.target.value as PaymentMethod)} className={FIELD}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
          <TextArea label="Texte des conditions de paiement" value={v.paymentTermsText} onChange={s.set("paymentTermsText")} rows={2} className="sm:col-span-2" />
        </div>
      </Section>
      <Section title="Mentions légales (bas de facture)">
        <div className="flex flex-col gap-4">
          <TextArea label="Escompte" value={v.earlyPaymentText} onChange={s.set("earlyPaymentText")} rows={2} />
          <TextArea label="Pénalités de retard" value={v.latePenaltyText} onChange={s.set("latePenaltyText")} rows={3} />
          <TextArea label="Indemnité forfaitaire de recouvrement" value={v.recoveryIndemnityText} onChange={s.set("recoveryIndemnityText")} rows={2} />
          <TextArea label="Réserve de propriété" value={v.retentionOfTitleText} onChange={s.set("retentionOfTitleText")} rows={2} />
          <TextArea
            label="Conditions générales (optionnel)"
            value={v.generalConditions}
            onChange={s.set("generalConditions")}
            rows={3}
            hint="Ajoutées en petit à la fin des devis et factures."
          />
        </div>
        <p className="mt-4 text-[12.5px] text-ash">Les factures déjà émises conservent les mentions en vigueur au jour de leur émission.</p>
      </Section>
      <SaveBar {...s} />
    </div>
  );
}

// ── Numérotation ───────────────────────────────────────────────────────────

export function NumberingForm({
  initial,
  next,
}: {
  initial: CommercialSettings["numbering"];
  next: { devis: number; facture: number; avoir: number };
}) {
  const router = useRouter();
  const s = useSave("numbering", initial);
  const v = s.value;
  const year = new Date().getFullYear();
  const [counters, setCounters] = useState(next);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const bump = async (kind: "devis" | "facture" | "avoir") => {
    setMsg(null);
    const res = await setNextNumberAction(kind, counters[kind]);
    setMsg(res.ok ? { ok: true, text: res.message ?? "Compteur mis à jour." } : { ok: false, text: res.error ?? "Impossible." });
    if (res.ok) router.refresh();
    else setCounters(next);
  };

  const rows: { kind: "devis" | "facture" | "avoir"; label: string; prefix: string; key: "quotePrefix" | "invoicePrefix" | "creditPrefix" }[] = [
    { kind: "devis", label: "Devis", prefix: v.quotePrefix, key: "quotePrefix" },
    { kind: "facture", label: "Factures (acompte, solde, rectificatives)", prefix: v.invoicePrefix, key: "invoicePrefix" },
    { kind: "avoir", label: "Avoirs", prefix: v.creditPrefix, key: "creditPrefix" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Section title="Format">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {rows.map((r) => (
            <Field key={r.key} label={`Préfixe ${r.kind}`} value={r.prefix} onChange={(x) => s.set(r.key)(x.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
          ))}
          <div>
            <label className={LABEL}>Chiffres</label>
            <NumberInput value={v.padding} step="1" min={1} max={6} onChange={(n) => s.set("padding")(n)} />
          </div>
        </div>
        <p className="mt-3 text-[12.5px] text-ash">
          Année automatique · exemple : <span className="font-mono font-semibold text-ink">{formatNumber(v.invoicePrefix || "FAC", year, 1, v.padding || 3)}</span>.
          Changer un préfixe n&apos;affecte jamais les documents existants.
        </p>
        <div className="mt-4">
          <SaveBar {...s} />
        </div>
      </Section>

      <Section title={`Prochains numéros — ${year}`}>
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.kind} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[13.5px] font-semibold">{r.label}</div>
                <div className="font-mono text-[13px] text-green">{formatNumber(initial[r.key], year, counters[r.kind], initial.padding)}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <NumberInput value={counters[r.kind]} step="1" min={1} onChange={(n) => setCounters((c) => ({ ...c, [r.kind]: Math.round(n) }))} ariaLabel={`Prochain numéro ${r.kind}`} />
                </div>
                <button type="button" className={BTN} onClick={() => bump(r.kind)} disabled={counters[r.kind] === next[r.kind]}>
                  Appliquer
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-ash">
          Numérotation chronologique, unique et continue : un numéro attribué n&apos;est jamais réutilisé, même après suppression
          d&apos;un brouillon. Le compteur ne peut qu&apos;avancer (utile pour reprendre une numérotation existante). Les factures ne
          reçoivent leur numéro qu&apos;à l&apos;émission.
        </p>
        {msg && <div className="mt-3">{msg.ok ? <SuccessNote>{msg.text}</SuccessNote> : <ErrorNote>{msg.text}</ErrorNote>}</div>}
      </Section>
    </div>
  );
}

// ── Emails ─────────────────────────────────────────────────────────────────

export function EmailForm({ initial, configured }: { initial: CommercialSettings["email"]; configured: boolean }) {
  const s = useSave("email", initial);
  const v = s.value;
  return (
    <div className="flex flex-col gap-6">
      <Section title="Envoi">
        <p className="text-[13px] leading-[1.6] text-slate">
          {configured ? (
            <>Envoi automatique <strong className="text-green">actif</strong> : le PDF est joint automatiquement.</>
          ) : (
            <>
              Envoi automatique <strong>non configuré</strong>. Renseignez <code>RESEND_API_KEY</code> et <code>EMAIL_FROM</code> dans les
              variables d&apos;environnement Vercel pour l&apos;activer. En attendant, le bouton « Envoyer par email » ouvre votre
              messagerie avec le message prérempli.
            </>
          )}
        </p>
        <p className="mt-2 text-[12.5px] text-ash">
          Variables disponibles : {"{numero} {client} {contact} {montant} {type} {type_minuscule} {objet} {lien_acceptation}"}
        </p>
      </Section>
      <Section title="Devis">
        <div className="flex flex-col gap-4">
          <Field label="Objet" value={v.quoteSubject} onChange={s.set("quoteSubject")} />
          <TextArea label="Message" value={v.quoteBody} onChange={s.set("quoteBody")} rows={9} />
        </div>
      </Section>
      <Section title="Factures">
        <div className="flex flex-col gap-4">
          <Field label="Objet" value={v.invoiceSubject} onChange={s.set("invoiceSubject")} />
          <TextArea label="Message" value={v.invoiceBody} onChange={s.set("invoiceBody")} rows={8} />
        </div>
      </Section>
      <Section title="Avoirs">
        <div className="flex flex-col gap-4">
          <Field label="Objet" value={v.creditSubject} onChange={s.set("creditSubject")} />
          <TextArea label="Message" value={v.creditBody} onChange={s.set("creditBody")} rows={6} />
        </div>
      </Section>
      <SaveBar {...s} />
    </div>
  );
}

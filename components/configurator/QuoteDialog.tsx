"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { submitDesignQuote } from "@/app/actions/configurator";
import { cn } from "@/lib/cn";
import type { DesignConfig } from "@/lib/configurator/types";
import { LABEL } from "./ui";

const FIELD =
  "mt-1.5 w-full rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Marge sous la limite de 4 Mo des actions serveur. */
const PAYLOAD_MAX = 3_800_000;

export function QuoteDialog({
  open,
  onClose,
  design,
  capturePreviews,
}: {
  open: boolean;
  onClose: () => void;
  design: DesignConfig;
  capturePreviews: () => { front: string; back: string } | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState({ club: "", contactName: "", email: "", phone: "", quantity: "", comment: "" });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ reference: string; notified: boolean } | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.club.trim()) return setError("Indiquez le nom du club.");
    if (!form.contactName.trim()) return setError("Indiquez le nom et prénom du contact.");
    if (!EMAIL_RE.test(form.email.trim())) return setError("Indiquez une adresse email valide.");
    if (!(Number(form.quantity) >= 1)) return setError("Indiquez une quantité estimée.");

    const previews = capturePreviews();
    if (!previews) return setError("Aperçu 3D indisponible : la demande ne peut pas être accompagnée du visuel.");
    const payloadSize = previews.front.length + previews.back.length + design.customLogos.reduce((n, l) => n + l.src.length, 0);
    if (payloadSize > PAYLOAD_MAX) {
      return setError("Vos logos sont trop lourds pour l'envoi groupé. Importez des fichiers plus légers (PNG simples).");
    }

    setSending(true);
    try {
      const result = await submitDesignQuote({ ...form, design, previews });
      if (result.ok) setSent({ reference: result.reference, notified: result.notified });
      else setError(result.error);
    } catch {
      setError("La demande n'a pas pu être transmise (connexion ou taille des fichiers). Réessayez.");
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    onClose();
    if (sent) setSent(null);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onCancel={close}
      className="m-auto w-[calc(100%-32px)] max-w-[520px] rounded-2xl p-0 text-ink shadow-immersive backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative max-h-[88dvh] overflow-y-auto p-6 md:p-8">
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-sharp p-2 text-stone transition-colors hover:bg-paper hover:text-ink"
        >
          <X size={18} aria-hidden />
        </button>

        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-green text-white">
              <Check size={26} strokeWidth={2.5} aria-hidden />
            </span>
            <h2 className="mt-6 text-[22px] font-bold tracking-tight">Demande transmise</h2>
            <p className="mt-3 max-w-[38ch] text-[14px] leading-[1.6] text-stone">
              Votre création <strong className="font-semibold text-ink">{sent.reference}</strong> a bien été enregistrée
              chez Lemnos avec ses aperçus. Nous revenons vers vous sous 48 h à l&apos;adresse {form.email.trim()}.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-7 rounded-sharp bg-green px-5 py-3 text-[12.5px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark"
            >
              Continuer
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <div className="text-label font-semibold uppercase text-green">Demande de devis</div>
              <h2 className="mt-2 text-[22px] font-bold tracking-tight">Transmettre ma création</h2>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-stone">
                Le design <span className="font-semibold text-ink">{design.designId}</span>, sa configuration complète et
                les vues face / dos sont joints automatiquement.
              </p>
            </div>
            <label className="block">
              <span className={LABEL}>Nom du club *</span>
              <input value={form.club} onChange={set("club")} required className={FIELD} placeholder="FC Littoral" autoComplete="organization" />
            </label>
            <label className="block">
              <span className={LABEL}>Nom et prénom du contact *</span>
              <input value={form.contactName} onChange={set("contactName")} required className={FIELD} autoComplete="name" />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>Email *</span>
                <input type="email" value={form.email} onChange={set("email")} required className={FIELD} autoComplete="email" />
              </label>
              <label className="block">
                <span className={LABEL}>Téléphone</span>
                <input type="tel" value={form.phone} onChange={set("phone")} className={FIELD} autoComplete="tel" />
              </label>
            </div>
            <label className="block">
              <span className={LABEL}>Quantité estimée *</span>
              <input value={form.quantity} onChange={set("quantity")} inputMode="numeric" className={cn(FIELD, "max-w-[160px]")} placeholder="20" />
            </label>
            <label className="block">
              <span className={LABEL}>Commentaires</span>
              <textarea value={form.comment} onChange={set("comment")} rows={3} className={cn(FIELD, "resize-y")} placeholder="Tailles, délais, short et chaussettes assortis…" />
            </label>
            {error && (
              <p role="alert" className="rounded-field bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="rounded-sharp bg-green px-5 py-3.5 text-[13px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-60"
            >
              {sending ? "Envoi en cours…" : "Envoyer la demande"}
            </button>
            <p className="text-[11.5px] leading-[1.5] text-ash">
              Vos données servent uniquement à traiter cette demande. Voir notre{" "}
              <a href="/confidentialite" className="underline underline-offset-2">
                politique de confidentialité
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </dialog>
  );
}

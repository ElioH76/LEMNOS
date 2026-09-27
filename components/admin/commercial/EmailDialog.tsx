"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Mail, Paperclip, Send } from "lucide-react";
import { emailDraftAction, sendDocumentEmailAction, type EmailDraft } from "@/app/actions/commercial";
import { BTN, BTN_PRIMARY, ErrorNote, FIELD, Field, LABEL, Modal, WarnNote } from "./ui";

/** Envoi d'un document par email : destinataire, objet et message préremplis et modifiables. */
export function EmailDialog({ docId, isQuote, onClose }: { docId: string; isQuote: boolean; onClose: () => void }) {
  const router = useRouter();
  const [withLink, setWithLink] = useState(isQuote);
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let alive = true;
    emailDraftAction(docId, withLink).then((res) => {
      if (!alive) return;
      if (!res.ok || !res.draft) return setError(res.error ?? "Préparation impossible.");
      setDraft(res.draft);
      setTo((v) => v || res.draft!.to);
      setSubject(res.draft.subject);
      setMessage(res.draft.message);
    });
    return () => {
      alive = false;
    };
  }, [docId, withLink]);

  const send = async () => {
    setError(null);
    setSending(true);
    const res = await sendDocumentEmailAction(docId, { to, cc, subject, message });
    setSending(false);
    if (res.ok) {
      setSent(true);
      router.refresh();
    } else setError(res.error ?? "Envoi impossible.");
  };

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}${cc ? `&cc=${encodeURIComponent(cc)}` : ""}&body=${encodeURIComponent(message)}`;

  return (
    <Modal title="Envoyer par email" onClose={onClose} wide>
      {sent ? (
        <div className="py-6 text-center">
          <Mail className="mx-auto text-green" size={28} />
          <p className="mt-3 text-[15px] font-semibold">Email envoyé à {to}.</p>
          <p className="mt-1 text-[13px] text-ash">L&apos;envoi est enregistré dans l&apos;historique du document.</p>
          <button type="button" onClick={onClose} className={`${BTN_PRIMARY} mt-5`}>
            Fermer
          </button>
        </div>
      ) : !draft ? (
        error ? <ErrorNote>{error}</ErrorNote> : <p className="py-8 text-center text-[13.5px] text-ash">Préparation de l&apos;email…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {!draft.configured && (
            <WarnNote>
              <strong>Envoi automatique non configuré</strong> (variables <code>RESEND_API_KEY</code> et <code>EMAIL_FROM</code>). Vous
              pouvez ouvrir votre messagerie avec ce message prérempli, puis joindre le PDF téléchargé.
            </WarnNote>
          )}
          <Field label="Destinataire(s)" value={to} onChange={setTo} placeholder="contact@club.fr" required />
          <Field label="Copie (optionnel)" value={cc} onChange={setCc} placeholder="tresorier@club.fr" />
          <Field label="Objet" value={subject} onChange={setSubject} required />
          <div>
            <label className={LABEL}>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={11} className={`${FIELD} resize-y leading-[1.55]`} />
          </div>
          {isQuote && (
            <label className="flex items-center gap-2 text-[13px] text-slate">
              <input type="checkbox" checked={withLink} onChange={(e) => setWithLink(e.target.checked)} className="h-4 w-4 accent-[#1E5B3C]" />
              Inclure le lien d&apos;acceptation en ligne
            </label>
          )}
          <div className="flex items-center gap-2 rounded-field bg-paper px-3 py-2 text-[12.5px] text-slate">
            <Paperclip size={14} className="text-ash" /> {draft.fileName}
            <span className="text-ash">— joint automatiquement</span>
          </div>
          {isQuote && (
            <p className="text-[12px] text-ash">Un devis envoyé passe au statut « Envoyé » et n&apos;est plus modifiable (nouvelle version possible).</p>
          )}
          <ErrorNote>{error}</ErrorNote>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className={BTN}>
              Annuler
            </button>
            {draft.configured ? (
              <button type="button" onClick={send} disabled={sending} className={BTN_PRIMARY}>
                <Send size={15} /> {sending ? "Envoi…" : "Envoyer"}
              </button>
            ) : (
              <>
                <a href={`/admin/documents/${docId}/pdf`} className={BTN}>
                  <Download size={15} /> Télécharger le PDF
                </a>
                <a href={mailto} className={BTN_PRIMARY}>
                  <Mail size={15} /> Ouvrir ma messagerie
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

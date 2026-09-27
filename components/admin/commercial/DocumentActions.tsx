"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FilePen,
  FilePlus2,
  FileX2,
  Link2,
  Mail,
  Pencil,
  Printer,
  RotateCcw,
  Undo2,
  Send,
  Stamp,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  acceptQuoteAction,
  archiveAction,
  createCorrectiveAction,
  createCreditNoteAction,
  deleteDraftAction,
  duplicateAction,
  generateDepositAction,
  generateFinalAction,
  issueAction,
  markSentAction,
  publicLinkAction,
  reviseQuoteAction,
  setQuoteStatusAction,
  type ActionResult,
} from "@/app/actions/commercial";
import { quoteStatus, todayIso } from "@/lib/billing/calc";
import { documentTitle, type CommercialDocument } from "@/lib/billing/types";
import { cn } from "@/lib/cn";
import { EmailDialog } from "./EmailDialog";
import { BTN, BTN_DANGER, BTN_PRIMARY, ErrorNote, Field, LABEL, FIELD, Modal, SuccessNote, WarnNote } from "./ui";

type Dialog = null | "email" | "accept" | "credit" | "issue";

/**
 * Barre d'actions contextuelle d'un document : seules les actions permises par
 * son état sont proposées (le serveur revérifie chacune).
 */
export function DocumentActions({
  doc,
  next,
  hasIssuedInvoices,
  issueWarnings,
  hasCorrective,
  hasLinkedInvoices,
}: {
  doc: CommercialDocument;
  next: "acompte" | "finale" | null;
  hasIssuedInvoices: boolean;
  issueWarnings: string[];
  hasCorrective: boolean;
  /** Au moins une facture (même brouillon) liée au devis. */
  hasLinkedInvoices: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isQuote = doc.type === "devis";
  const isInvoice = doc.type === "facture";
  const qs = isQuote ? quoteStatus(doc) : null;
  const draft = isQuote ? doc.quoteStatus === "brouillon" : doc.lifecycle === "brouillon";
  const base = isQuote ? "/admin/devis" : "/admin/factures";
  const title = documentTitle(doc).toLowerCase();

  const act = async (fn: () => Promise<ActionResult>, opts: { confirm?: string; goTo?: (id: string) => string; after?: string } = {}) => {
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Opération impossible.");
    if (opts.goTo && res.id) router.push(opts.goTo(res.id));
    else if (opts.after) router.push(opts.after);
    else {
      if (res.message) setNotice(res.message);
      router.refresh();
    }
  };

  const copyLink = async () => {
    setError(null);
    const res = await publicLinkAction(doc.id);
    if (!res.ok || !res.url) return setError(res.error ?? "Lien indisponible.");
    try {
      await navigator.clipboard.writeText(res.url);
      setNotice(`Lien d'acceptation copié : ${res.url}`);
    } catch {
      setNotice(`Lien d'acceptation : ${res.url}`);
    }
    router.refresh();
  };

  const pdf = `/admin/documents/${doc.id}/pdf`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Actions principales selon l'état */}
        {isQuote && qs === "accepte" && next && (
          <button
            type="button"
            disabled={busy}
            className={BTN_PRIMARY}
            onClick={() =>
              act(() => (next === "acompte" ? generateDepositAction(doc.id) : generateFinalAction(doc.id)), {
                goTo: (id) => `/admin/factures/${id}`,
              })
            }
          >
            <FilePlus2 size={15} /> {next === "acompte" ? "Générer la facture d'acompte" : "Générer la facture finale"}
          </button>
        )}
        {!isQuote && draft && (
          <button type="button" disabled={busy} className={BTN_PRIMARY} onClick={() => setDialog("issue")}>
            <Stamp size={15} /> Émettre {doc.type === "avoir" ? "l'avoir" : "la facture"}
          </button>
        )}
        {isQuote && (qs === "brouillon" || qs === "envoye" || qs === "expire") && (
          <button type="button" disabled={busy} className={qs === "brouillon" ? BTN : BTN_PRIMARY} onClick={() => setDialog("accept")}>
            <CheckCircle2 size={15} /> Marquer accepté
          </button>
        )}

        {draft && doc.type !== "avoir" && (
          <Link href={`${base}/${doc.id}/modifier`} className={BTN}>
            <Pencil size={15} /> Modifier
          </Link>
        )}
        {(isQuote ? !["refuse", "annule"].includes(qs!) : !draft && doc.lifecycle !== "annulee") && (
          <button type="button" className={BTN} onClick={() => setDialog("email")}>
            <Mail size={15} /> Envoyer par email
          </button>
        )}
        {((isQuote && qs === "brouillon") || (!isQuote && !draft && !doc.sentAt && doc.lifecycle === "emise")) && (
          <button
            type="button"
            disabled={busy}
            className={BTN}
            onClick={() =>
              act(() => markSentAction(doc.id), {
                confirm: isQuote ? "Marquer ce devis comme envoyé ? Il ne sera plus modifiable." : undefined,
              })
            }
          >
            <Send size={15} /> Marquer envoyé
          </button>
        )}
        {isQuote && (qs === "envoye" || qs === "expire") && (
          <button type="button" className={BTN} onClick={copyLink}>
            <Link2 size={15} /> Lien d&apos;acceptation
          </button>
        )}

        <a href={pdf} className={BTN}>
          <Download size={15} /> PDF
        </a>
        <a href={`${pdf}?inline=1`} target="_blank" rel="noopener noreferrer" className={BTN}>
          <Printer size={15} /> Imprimer
        </a>
        {doc.type !== "avoir" && (
          <button type="button" disabled={busy} className={BTN} onClick={() => act(() => duplicateAction(doc.id), { goTo: (id) => `${base}/${id}/modifier` })}>
            <Copy size={15} /> Dupliquer
          </button>
        )}
      </div>

      {/* Actions secondaires */}
      <div className="flex flex-wrap items-center gap-1">
        {isQuote && qs !== "brouillon" && !hasLinkedInvoices && !doc.replacedBy && (
          <button
            type="button"
            disabled={busy}
            className={BTN_DANGER}
            onClick={() =>
              act(() => setQuoteStatusAction(doc.id, "brouillon"), {
                confirm:
                  "Repasser ce devis en brouillon pour le modifier ? Il garde son numéro ; l'acceptation éventuelle et le lien d'acceptation en ligne seront retirés. À ne faire que si le client n'a pas reçu ce devis.",
              })
            }
          >
            <Undo2 size={15} /> Repasser en brouillon
          </button>
        )}
        {isQuote && (qs === "envoye" || qs === "expire") && (
          <button type="button" disabled={busy} className={BTN_DANGER} onClick={() => act(() => setQuoteStatusAction(doc.id, "refuse"), { confirm: "Marquer ce devis comme refusé ?" })}>
            <XCircle size={15} /> Refusé
          </button>
        )}
        {isQuote && qs !== "brouillon" && qs !== "annule" && !hasIssuedInvoices && (
          <button
            type="button"
            disabled={busy}
            className={BTN_DANGER}
            onClick={() =>
              act(() => reviseQuoteAction(doc.id), {
                confirm: "Créer une nouvelle version ? Ce devis sera annulé et remplacé par un nouveau numéro, modifiable.",
                goTo: (id) => `/admin/devis/${id}/modifier`,
              })
            }
          >
            <FilePen size={15} /> Nouvelle version
          </button>
        )}
        {isQuote && qs !== "annule" && qs !== "brouillon" && !hasIssuedInvoices && (
          <button type="button" disabled={busy} className={BTN_DANGER} onClick={() => act(() => setQuoteStatusAction(doc.id, "annule"), { confirm: "Annuler ce devis ?" })}>
            <Ban size={15} /> Annuler le devis
          </button>
        )}
        {isInvoice && doc.lifecycle === "emise" && (
          <button type="button" disabled={busy} className={BTN_DANGER} onClick={() => setDialog("credit")}>
            <FileX2 size={15} /> Annuler par un avoir
          </button>
        )}
        {isInvoice && doc.lifecycle === "annulee" && !hasCorrective && (
          <button
            type="button"
            disabled={busy}
            className={BTN_DANGER}
            onClick={() => act(() => createCorrectiveAction(doc.id), { goTo: (id) => `/admin/factures/${id}/modifier` })}
          >
            <RotateCcw size={15} /> Créer la facture rectificative
          </button>
        )}
        {!draft && (
          <button type="button" disabled={busy} className={BTN_DANGER} onClick={() => act(() => archiveAction(doc.id, !doc.archived))}>
            {doc.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />} {doc.archived ? "Désarchiver" : "Archiver"}
          </button>
        )}
        {draft && (
          <button
            type="button"
            disabled={busy}
            className={cn(BTN_DANGER, "ml-auto")}
            onClick={() => act(() => deleteDraftAction(doc.id), { confirm: `Supprimer définitivement ce brouillon de ${title} ?`, after: base })}
          >
            <Trash2 size={15} /> Supprimer le brouillon
          </button>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>
      <SuccessNote>{notice}</SuccessNote>

      {dialog === "email" && <EmailDialog docId={doc.id} isQuote={isQuote} onClose={() => setDialog(null)} />}
      {dialog === "accept" && <AcceptDialog doc={doc} onClose={() => setDialog(null)} onDone={() => { setDialog(null); router.refresh(); }} />}
      {dialog === "credit" && (
        <CreditDialog
          doc={doc}
          onClose={() => setDialog(null)}
          onDone={(id) => router.push(`/admin/factures/${id}`)}
        />
      )}
      {dialog === "issue" && (
        <Modal title={`Émettre ${doc.type === "avoir" ? "l'avoir" : "la facture"}`} onClose={() => setDialog(null)}>
          <div className="flex flex-col gap-4 text-[13.5px] leading-[1.6] text-slate">
            <p>
              L&apos;émission attribue le <strong>numéro définitif</strong>, date le document d&apos;aujourd&apos;hui, fige les
              informations (client, émetteur, banque, mentions) et <strong>verrouille</strong> le document. Toute correction
              passera ensuite par un avoir.
            </p>
            {issueWarnings.length > 0 && (
              <WarnNote>
                <strong>À vérifier avant émission :</strong>
                <ul className="mt-1 list-disc pl-5">
                  {issueWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </WarnNote>
            )}
            <ErrorNote>{error}</ErrorNote>
            <div className="flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setDialog(null)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                className={BTN_PRIMARY}
                onClick={async () => {
                  setBusy(true);
                  const res = await issueAction(doc.id);
                  setBusy(false);
                  if (!res.ok) return setError(res.error ?? "Émission impossible.");
                  setDialog(null);
                  router.refresh();
                }}
              >
                <Check size={15} /> {busy ? "Émission…" : "Émettre"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AcceptDialog({ doc, onClose, onDone }: { doc: CommercialDocument; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    date: todayIso(),
    name: doc.client.contact,
    role: doc.client.contactRole,
    email: doc.client.email,
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Modal title="Enregistrer l'acceptation du devis" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-slate">
          À utiliser quand le client a donné son accord hors ligne (devis signé, email, rendez-vous). Une fois accepté, le devis
          n&apos;est plus modifiable.
        </p>
        <Field label="Date d'acceptation" type="date" value={f.date} onChange={set("date")} />
        <Field label="Nom du signataire" value={f.name} onChange={set("name")} required />
        <Field label="Fonction" value={f.role} onChange={set("role")} placeholder="Président" />
        <Field label="Email" type="email" value={f.email} onChange={set("email")} />
        <div>
          <label className={LABEL}>Justificatif / canal</label>
          <input value={f.note} onChange={(e) => set("note")(e.target.value)} placeholder="Devis signé reçu par email le…" className={FIELD} />
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <button type="button" className={BTN} onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            className={BTN_PRIMARY}
            onClick={async () => {
              setBusy(true);
              const res = await acceptQuoteAction(doc.id, f);
              setBusy(false);
              if (res.ok) onDone();
              else setError(res.error ?? "Impossible.");
            }}
          >
            <CheckCircle2 size={15} /> Confirmer l&apos;acceptation
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreditDialog({ doc, onClose, onDone }: { doc: CommercialDocument; onClose: () => void; onDone: (id: string) => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title={`Annuler la facture ${doc.number}`} onClose={onClose}>
      <div className="flex flex-col gap-4 text-[13.5px] leading-[1.6] text-slate">
        <p>
          Une facture émise ne se modifie pas et ne se supprime pas. Un <strong>avoir</strong> du même montant va être préparé
          (brouillon). À son émission, la facture passera « Annulée » ; vous pourrez alors créer une <strong>facture
          rectificative</strong> corrigée si nécessaire.
        </p>
        <Field label="Motif" value={reason} onChange={setReason} placeholder="Erreur sur la quantité facturée" />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <button type="button" className={BTN} onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            className={BTN_PRIMARY}
            onClick={async () => {
              setBusy(true);
              const res = await createCreditNoteAction(doc.id, reason);
              setBusy(false);
              if (res.ok && res.id) onDone(res.id);
              else setError(res.error ?? "Impossible.");
            }}
          >
            <FileX2 size={15} /> Préparer l&apos;avoir
          </button>
        </div>
      </div>
    </Modal>
  );
}

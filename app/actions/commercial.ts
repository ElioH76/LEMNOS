"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";
import { documentAmounts, formatEuro } from "@/lib/billing/calc";
import * as service from "@/lib/billing/service";
import { DomainError } from "@/lib/billing/service";
import { type CommercialSettings, fillTemplate } from "@/lib/billing/settings";
import {
  createClient,
  createProductTemplate,
  deleteProductTemplate,
  getDocument,
  getSettings,
  saveSettings,
  setNextSequence,
} from "@/lib/billing/store";
import {
  CLIENT_TYPES,
  documentTitle,
  type Client,
  type ClientProfileInput,
  type DocumentInput,
  type Payment,
  type ProductTemplate,
} from "@/lib/billing/types";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { archivePdf, documentPdf } from "@/lib/pdf/archive";
import { pdfFileName } from "@/lib/pdf/render";

/**
 * Actions serveur de la gestion commerciale. Chacune vérifie la session admin
 * AVANT toute lecture ou écriture ; les règles métier vivent dans
 * lib/billing/service.ts.
 */

async function assertAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Non autorisé.");
}

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  message?: string;
}

async function run(fn: () => Promise<string | void>, success?: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    const id = await fn();
    revalidatePath("/admin", "layout");
    return { ok: true, id: id ?? undefined, message: success };
  } catch (err) {
    if (err instanceof DomainError) return { ok: false, error: err.message };
    console.error("[commercial]", err);
    return { ok: false, error: "Opération impossible. Réessayez." };
  }
}

// ── Documents ──────────────────────────────────────────────────────────────

export async function saveQuoteAction(id: string | null, input: Partial<DocumentInput>) {
  return run(async () => (id ? (await service.updateQuote(id, input)).id : (await service.createQuote(input)).id));
}

export async function saveInvoiceAction(id: string | null, input: Partial<DocumentInput>) {
  return run(async () =>
    id ? (await service.updateInvoiceDraft(id, input)).id : (await service.createInvoice(input)).id,
  );
}

export async function markSentAction(id: string) {
  return run(async () => void (await service.markDocumentSent(id, "Marqué comme envoyé manuellement")), "Marqué comme envoyé.");
}

export async function acceptQuoteAction(
  id: string,
  data: { date: string; name: string; role: string; email: string; note: string },
) {
  return run(
    async () =>
      void (await service.acceptQuote(id, {
        date: data.date,
        name: data.name.trim().slice(0, 200),
        role: data.role.trim().slice(0, 200),
        email: data.email.trim().slice(0, 200),
        note: data.note.trim().slice(0, 1000),
        method: "admin",
      })),
    "Devis accepté.",
  );
}

export async function setQuoteStatusAction(id: string, status: "refuse" | "annule" | "brouillon") {
  return run(async () => void (await service.setQuoteStatus(id, status)));
}

export async function reviseQuoteAction(id: string) {
  return run(async () => (await service.reviseQuote(id)).id);
}

export async function setFulfillmentAction(id: string, step: "production" | "delivered", date: string) {
  return run(async () => void (await service.setFulfillment(id, step, date)));
}

export async function generateDepositAction(quoteId: string) {
  return run(async () => (await service.generateDepositInvoice(quoteId)).id);
}

export async function generateFinalAction(quoteId: string) {
  return run(async () => (await service.generateFinalInvoice(quoteId)).id);
}

export async function issueAction(id: string) {
  return run(async () => {
    const doc = await service.issueDocument(id);
    const url = await archivePdf(doc);
    if (url) await service.setAdminPdf(doc.id, url);
    return doc.id;
  }, "Document émis.");
}

export async function recordPaymentAction(id: string, payment: Partial<Payment>) {
  return run(async () => void (await service.recordPayment(id, payment)), "Paiement enregistré.");
}

export async function deletePaymentAction(id: string, paymentId: string) {
  return run(async () => void (await service.deletePayment(id, paymentId)));
}

export async function createCreditNoteAction(invoiceId: string, reason: string) {
  return run(async () => (await service.createCreditNote(invoiceId, reason)).id);
}

export async function createCorrectiveAction(invoiceId: string) {
  return run(async () => (await service.createCorrectiveInvoice(invoiceId)).id);
}

export async function duplicateAction(id: string) {
  return run(async () => (await service.duplicateDocument(id)).id);
}

export async function archiveAction(id: string, archived: boolean) {
  return run(async () => void (await service.setArchived(id, archived)));
}

export async function deleteDraftAction(id: string) {
  return run(async () => void (await service.deleteDraft(id)));
}

// ── Lien d'acceptation & email ─────────────────────────────────────────────

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function publicLinkAction(id: string): Promise<ActionResult & { url?: string }> {
  await assertAdmin();
  try {
    const token = await service.ensurePublicToken(id);
    revalidatePath("/admin", "layout");
    return { ok: true, url: `${await siteOrigin()}/devis/${token}` };
  } catch (err) {
    return { ok: false, error: err instanceof DomainError ? err.message : "Lien indisponible." };
  }
}

export interface EmailDraft {
  configured: boolean;
  to: string;
  subject: string;
  message: string;
  fileName: string;
}

/** Prépare l'email (destinataire, objet, message) à partir des modèles. */
export async function emailDraftAction(id: string, withLink: boolean): Promise<ActionResult & { draft?: EmailDraft }> {
  await assertAdmin();
  const doc = await getDocument(id);
  if (!doc) return { ok: false, error: "Document introuvable." };
  const settings = await getSettings();
  let link = "";
  if (doc.type === "devis" && withLink) {
    const token = await service.ensurePublicToken(id);
    link = `Vous pouvez consulter et accepter ce devis en ligne :\n${await siteOrigin()}/devis/${token}\n\n`;
  }
  const title = documentTitle(doc);
  const vars = {
    numero: doc.number ?? "",
    client: doc.client.club,
    contact: doc.client.contact,
    montant: formatEuro(documentAmounts(doc).amountDue),
    type: title,
    type_minuscule: title.charAt(0).toLowerCase() + title.slice(1),
    lien_acceptation: link,
    objet: doc.subject,
  };
  const t =
    doc.type === "devis"
      ? { s: settings.email.quoteSubject, b: settings.email.quoteBody }
      : doc.type === "avoir"
        ? { s: settings.email.creditSubject, b: settings.email.creditBody }
        : { s: settings.email.invoiceSubject, b: settings.email.invoiceBody };
  return {
    ok: true,
    draft: {
      configured: isEmailConfigured(),
      to: doc.client.email,
      subject: fillTemplate(t.s, vars),
      message: fillTemplate(t.b, vars).replace(/\n{3,}/g, "\n\n"),
      fileName: pdfFileName(doc),
    },
  };
}

export async function sendDocumentEmailAction(
  id: string,
  mail: { to: string; cc: string; subject: string; message: string },
): Promise<ActionResult> {
  await assertAdmin();
  const doc = await getDocument(id);
  if (!doc) return { ok: false, error: "Document introuvable." };
  if (doc.type !== "devis" && doc.lifecycle === "brouillon") {
    return { ok: false, error: "Émettez le document avant de l'envoyer." };
  }
  const split = (v: string) =>
    v
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  const to = split(mail.to);
  const cc = split(mail.cc);
  const valid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  if (!to.length || ![...to, ...cc].every(valid)) return { ok: false, error: "Adresse email invalide." };
  if (!mail.subject.trim()) return { ok: false, error: "L'objet est requis." };

  // Un devis envoyé se fige : on l'émet (statut Envoyé) AVANT de générer le PDF joint.
  const current = doc.type === "devis" && doc.quoteStatus === "brouillon" ? await service.markQuoteSent(id) : doc;
  const settings = await getSettings();
  const pdf = await documentPdf(current);
  const result = await sendEmail({
    to,
    cc,
    replyTo: settings.company.email,
    subject: mail.subject.trim().slice(0, 300),
    text: mail.message.slice(0, 20000),
    attachments: [{ filename: pdfFileName(current), content: pdf }],
  });
  if (!result.ok) return { ok: false, error: result.error };
  await service.markDocumentSent(id, `Email à ${to.join(", ")}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Email envoyé." };
}

// ── Clients (création rapide depuis un devis) ──────────────────────────────

export async function quickCreateClientAction(
  input: Partial<ClientProfileInput>,
): Promise<ActionResult & { client?: Client }> {
  await assertAdmin();
  if (!input.club?.trim()) return { ok: false, error: "Le nom est requis." };
  const client = await createClient({
    ...input,
    club: input.club.trim(),
    type: CLIENT_TYPES.includes(input.type as never) ? input.type : "association",
  });
  revalidatePath("/admin/clients");
  return { ok: true, id: client.id, client };
}

export async function saveProductTemplateAction(input: {
  label: string;
  description: string;
  unitPriceHt: number;
  vatRate: number;
}): Promise<ProductTemplate> {
  await assertAdmin();
  return createProductTemplate({
    label: input.label.trim().slice(0, 300),
    description: input.description.trim().slice(0, 1000),
    unitPriceHt: Math.max(0, Number(input.unitPriceHt) || 0),
    vatRate: Number(input.vatRate) || 0,
  });
}

export async function deleteProductTemplateAction(id: string): Promise<void> {
  await assertAdmin();
  await deleteProductTemplate(id);
}

// ── Paramètres ─────────────────────────────────────────────────────────────

export async function saveSettingsAction<K extends keyof CommercialSettings>(
  section: K,
  value: CommercialSettings[K],
): Promise<ActionResult> {
  return run(async () => {
    const settings = await getSettings();
    const clean = Object.fromEntries(
      Object.entries(value as object).map(([k, v]) => [k, typeof v === "string" ? v.trim().slice(0, 5000) : v]),
    ) as CommercialSettings[K];
    if (section === "numbering") {
      const n = clean as CommercialSettings["numbering"];
      for (const p of [n.quotePrefix, n.invoicePrefix, n.creditPrefix]) {
        if (!/^[A-Z0-9]{1,8}$/.test(p)) throw new DomainError("Préfixes : 1 à 8 lettres majuscules ou chiffres.");
      }
      if (new Set([n.quotePrefix, n.invoicePrefix, n.creditPrefix]).size < 3) {
        throw new DomainError("Les trois préfixes doivent être différents.");
      }
      n.padding = Math.min(6, Math.max(1, Math.round(Number(n.padding) || 3)));
    }
    if (section === "terms") {
      const t = clean as CommercialSettings["terms"];
      t.paymentDelayDays = Math.min(365, Math.max(0, Math.round(Number(t.paymentDelayDays) || 0)));
      t.quoteValidityDays = Math.min(365, Math.max(1, Math.round(Number(t.quoteValidityDays) || 30)));
      t.defaultDepositPercent = Math.min(100, Math.max(0, Number(t.defaultDepositPercent) || 0));
    }
    if (section === "bank") {
      const b = clean as CommercialSettings["bank"];
      b.iban = b.iban.replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
      b.bic = b.bic.replace(/\s+/g, "").toUpperCase();
    }
    await saveSettings({ ...settings, [section]: clean });
  }, "Paramètres enregistrés.");
}

export async function setNextNumberAction(kind: "devis" | "facture" | "avoir", next: number) {
  return run(async () => {
    const { numbering } = await getSettings();
    const prefix =
      kind === "devis" ? numbering.quotePrefix : kind === "avoir" ? numbering.creditPrefix : numbering.invoicePrefix;
    try {
      await setNextSequence(prefix, new Date().getFullYear(), Math.round(next));
    } catch (err) {
      throw new DomainError((err as Error).message);
    }
  }, "Compteur mis à jour.");
}


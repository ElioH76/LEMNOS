import "server-only";
import { randomBytes, randomUUID } from "crypto";
import { addDays, documentAmounts, formatEuro, isEditable, quoteStatus, round2, todayIso } from "./calc";
import { sellerSnapshot, termsSnapshot } from "./settings";
import {
  allocateNumber,
  getClient,
  getDocument,
  getSettings,
  insertDocument,
  listInvoices,
  removeDocument,
  writeDocument,
} from "./store";
import {
  PAYMENT_METHODS,
  clientSnapshot,
  displayNumber,
  documentTitle,
  type ClientSnapshot,
  type CommercialDocument,
  type Deduction,
  type DocumentInput,
  type DocumentLine,
  type DocumentType,
  type Payment,
  type QuoteAcceptance,
} from "./types";

/**
 * Règles métier de la gestion commerciale. Toute écriture passe par ici : les
 * verrous (document émis non modifiable, numérotation à l'émission, workflow
 * devis → acompte → solde) sont donc appliqués côté serveur, quelle que soit
 * l'interface qui appelle.
 */

export class DomainError extends Error {}

const fail = (message: string): never => {
  throw new DomainError(message);
};

function event(label: string, detail?: string) {
  return { id: randomUUID(), at: new Date().toISOString(), label, ...(detail ? { detail } : {}) };
}

function frDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// ── Saisie ─────────────────────────────────────────────────────────────────

const money = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? round2(Math.max(0, v)) : 0);
const text = (v: unknown, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

function cleanLines(lines: unknown): DocumentLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((l): DocumentLine => ({
      id: typeof l?.id === "string" && l.id ? l.id : randomUUID(),
      label: text(l?.label, 300),
      description: text(l?.description, 1000),
      quantity: typeof l?.quantity === "number" && Number.isFinite(l.quantity) ? Math.max(0, l.quantity) : 0,
      unitPriceHt: money(l?.unitPriceHt),
      vatRate: [0, 2.1, 5.5, 10, 20].includes(l?.vatRate) ? l.vatRate : 0,
      discountType: l?.discountType === "percent" ? "percent" : "amount",
      discountValue: l?.discountType === "percent" ? Math.min(100, money(l?.discountValue)) : money(l?.discountValue),
    }))
    .filter((l) => l.label || l.unitPriceHt);
}

/** Nettoie une saisie de formulaire (jamais de confiance dans le client). */
export function cleanInput(raw: Partial<DocumentInput>): DocumentInput {
  const depositType = raw.depositType === "percent" || raw.depositType === "amount" ? raw.depositType : "none";
  return {
    clientId: typeof raw.clientId === "string" && raw.clientId ? raw.clientId : null,
    subject: text(raw.subject, 300),
    date: date(raw.date) || todayIso(),
    lines: cleanLines(raw.lines),
    globalDiscountType: raw.globalDiscountType === "percent" ? "percent" : "amount",
    globalDiscountValue:
      raw.globalDiscountType === "percent" ? Math.min(100, money(raw.globalDiscountValue)) : money(raw.globalDiscountValue),
    globalDiscountLabel: text(raw.globalDiscountLabel, 120) || "Remise",
    shipping: money(raw.shipping),
    notes: text(raw.notes),
    paymentTerms: text(raw.paymentTerms),
    internalComments: text(raw.internalComments),
    validUntil: date(raw.validUntil),
    plannedDeliveryDate: date(raw.plannedDeliveryDate),
    deliveryLeadTime: text(raw.deliveryLeadTime, 200),
    depositType,
    depositValue: depositType === "percent" ? Math.min(100, money(raw.depositValue)) : money(raw.depositValue),
    dueDate: date(raw.dueDate),
    deliveryDate: date(raw.deliveryDate),
    paymentMethod: PAYMENT_METHODS.includes(raw.paymentMethod as never) ? raw.paymentMethod! : "virement",
    depositAmount: money(raw.depositAmount),
  };
}

async function snapshotFor(clientId: string | null): Promise<ClientSnapshot> {
  if (!clientId) return fail("Sélectionnez un client.");
  const client = await getClient(clientId);
  if (!client) return fail("Client introuvable.");
  return clientSnapshot(client);
}

function validateContent(input: DocumentInput) {
  if (input.lines.length === 0) fail("Ajoutez au moins une ligne de produit.");
  if (input.lines.some((l) => !l.label)) fail("Chaque ligne doit avoir une désignation.");
  if (input.lines.some((l) => l.quantity <= 0)) fail("Chaque ligne doit avoir une quantité positive.");
}

function blankDocument(type: DocumentType, input: DocumentInput, client: ClientSnapshot, vatExempt: boolean): CommercialDocument {
  const now = new Date().toISOString();
  return {
    ...input,
    id: randomUUID(),
    type,
    kind: "standard",
    number: null,
    quoteStatus: "brouillon",
    lifecycle: "brouillon",
    client,
    quoteId: null,
    invoiceId: null,
    correctsId: null,
    creditNoteId: null,
    revisionOf: null,
    replacedBy: null,
    reason: "",
    deductions: [],
    payments: [],
    acceptance: null,
    publicToken: null,
    fulfillment: { productionAt: null, deliveredAt: null },
    seller: null,
    bank: null,
    terms: null,
    vatExempt,
    issuedAt: null,
    sentAt: null,
    pdfUrl: null,
    archived: false,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function load(id: string): Promise<CommercialDocument> {
  return (await getDocument(id)) ?? fail("Document introuvable.");
}

async function logOnQuote(quoteId: string | null, label: string, detail?: string) {
  if (!quoteId) return;
  const quote = await getDocument(quoteId);
  if (!quote) return;
  quote.history.push(event(label, detail));
  await writeDocument(quote);
}

/** Fige émetteur, banque et mentions dans le document. */
async function freeze(doc: CommercialDocument) {
  const settings = await getSettings();
  doc.seller = sellerSnapshot(settings.company);
  doc.bank = { ...settings.bank };
  doc.terms = termsSnapshot(settings);
  if (doc.clientId) {
    const client = await getClient(doc.clientId);
    if (client) doc.client = clientSnapshot(client);
  }
}

// ── Devis ──────────────────────────────────────────────────────────────────

export async function createQuote(raw: Partial<DocumentInput>, opts: { revisionOf?: string } = {}) {
  const input = cleanInput(raw);
  validateContent(input);
  const settings = await getSettings();
  const doc = blankDocument("devis", input, await snapshotFor(input.clientId), settings.company.vatExempt);
  if (!doc.validUntil) doc.validUntil = addDays(doc.date, settings.terms.quoteValidityDays);
  doc.number = await allocateNumber("devis", doc.date);
  doc.revisionOf = opts.revisionOf ?? null;
  doc.history.push(event("Devis créé", opts.revisionOf ? "Nouvelle version d'un devis existant" : undefined));
  return insertDocument(doc);
}

export async function updateQuote(id: string, raw: Partial<DocumentInput>) {
  const doc = await load(id);
  if (doc.type !== "devis") fail("Ce document n'est pas un devis.");
  if (!isEditable(doc)) fail("Ce devis n'est plus modifiable. Créez une nouvelle version pour le corriger.");
  const input = cleanInput(raw);
  validateContent(input);
  Object.assign(doc, input, { client: await snapshotFor(input.clientId) });
  doc.history.push(event("Devis modifié"));
  return writeDocument(doc);
}

/** Envoi (email ou manuel) : le devis passe « Envoyé » et se fige. */
export async function markQuoteSent(id: string, detail?: string) {
  const doc = await load(id);
  if (doc.type !== "devis") fail("Ce document n'est pas un devis.");
  if (doc.quoteStatus === "brouillon") {
    await freeze(doc);
    doc.quoteStatus = "envoye";
    doc.history.push(event("Devis envoyé", detail));
  } else {
    doc.history.push(event("Devis renvoyé", detail));
  }
  doc.sentAt = new Date().toISOString();
  return writeDocument(doc);
}

export async function ensurePublicToken(id: string): Promise<string> {
  const doc = await load(id);
  if (doc.type !== "devis") fail("Seul un devis peut être accepté en ligne.");
  if (!doc.publicToken) {
    doc.publicToken = randomBytes(24).toString("base64url");
    doc.history.push(event("Lien d'acceptation en ligne créé"));
    await writeDocument(doc);
  }
  return doc.publicToken!;
}

export async function acceptQuote(
  id: string,
  acceptance: Omit<QuoteAcceptance, "at">,
  opts: { online?: boolean } = {},
) {
  const doc = await load(id);
  if (doc.type !== "devis") fail("Ce document n'est pas un devis.");
  const status = quoteStatus(doc);
  if (opts.online) {
    if (status === "expire") fail("La validité de ce devis est dépassée. Contactez LEMNOS pour un devis actualisé.");
    if (status !== "envoye") fail("Ce devis ne peut plus être accepté en ligne.");
  } else if (!["brouillon", "envoye", "expire"].includes(status)) {
    fail(`Un devis « ${status} » ne peut pas être accepté.`);
  }
  if (!acceptance.name.trim()) fail("Le nom du signataire est requis.");
  if (doc.quoteStatus === "brouillon" || !doc.seller) await freeze(doc);
  doc.quoteStatus = "accepte";
  doc.acceptance = { ...acceptance, at: new Date().toISOString() };
  const how =
    acceptance.method === "admin"
      ? "enregistré par LEMNOS"
      : acceptance.method === "en_ligne_signature"
        ? "en ligne, avec signature dessinée"
        : "en ligne, bon pour accord";
  doc.history.push(event("Devis accepté", `${acceptance.name}${acceptance.role ? `, ${acceptance.role}` : ""} — ${how}`));
  return writeDocument(doc);
}

export async function setQuoteStatus(id: string, status: "refuse" | "annule" | "brouillon") {
  const doc = await load(id);
  if (doc.type !== "devis") fail("Ce document n'est pas un devis.");
  const current = quoteStatus(doc);
  if (status === "refuse") {
    if (!["envoye", "expire"].includes(current)) fail("Seul un devis envoyé peut être marqué refusé.");
    doc.quoteStatus = "refuse";
    doc.history.push(event("Devis refusé"));
  } else if (status === "annule") {
    if (current === "annule") return doc;
    const linked = (await listInvoices()).filter((d) => d.quoteId === id && d.lifecycle === "emise");
    if (linked.length) fail("Des factures émises sont liées à ce devis : annulez-les d'abord par un avoir.");
    doc.quoteStatus = "annule";
    doc.history.push(event("Devis annulé"));
  } else {
    fail("Transition non autorisée.");
  }
  return writeDocument(doc);
}

/** Nouvelle version : nouveau devis (nouveau numéro), l'ancien est annulé et lié. */
export async function reviseQuote(id: string) {
  const doc = await load(id);
  if (doc.type !== "devis") fail("Ce document n'est pas un devis.");
  if (doc.quoteStatus === "brouillon") fail("Un brouillon se modifie directement.");
  const linked = (await listInvoices()).filter((d) => d.quoteId === id && d.lifecycle === "emise");
  if (linked.length) fail("Des factures émises sont liées à ce devis : une nouvelle version n'est plus possible.");
  const copy = await createQuote(copyInput(doc, { keepDates: false }), { revisionOf: id });
  doc.quoteStatus = "annule";
  doc.replacedBy = copy.id;
  doc.history.push(event("Remplacé par une nouvelle version", copy.number ?? undefined));
  await writeDocument(doc);
  return copy;
}

export async function setFulfillment(quoteId: string, step: "production" | "delivered", when: string) {
  const doc = await load(quoteId);
  if (doc.type !== "devis" || doc.quoteStatus !== "accepte") fail("Le suivi de commande commence après l'acceptation du devis.");
  const at = date(when) || todayIso();
  if (step === "production") {
    doc.fulfillment.productionAt = at;
    doc.history.push(event("Commande en production", frDate(at)));
  } else {
    if (!doc.fulfillment.productionAt) doc.fulfillment.productionAt = at;
    doc.fulfillment.deliveredAt = at;
    doc.history.push(event("Commande livrée", `Livraison réelle le ${frDate(at)}`));
  }
  return writeDocument(doc);
}

// ── Factures ───────────────────────────────────────────────────────────────

function copyInput(doc: CommercialDocument, opts: { keepDates: boolean }): DocumentInput {
  const today = todayIso();
  return {
    clientId: doc.clientId,
    subject: doc.subject,
    date: opts.keepDates ? doc.date : today,
    lines: doc.lines.map((l) => ({ ...l, id: randomUUID() })),
    globalDiscountType: doc.globalDiscountType,
    globalDiscountValue: doc.globalDiscountValue,
    globalDiscountLabel: doc.globalDiscountLabel,
    shipping: doc.shipping,
    notes: doc.notes,
    paymentTerms: doc.paymentTerms,
    internalComments: "",
    validUntil: opts.keepDates ? doc.validUntil : "",
    plannedDeliveryDate: doc.plannedDeliveryDate,
    deliveryLeadTime: doc.deliveryLeadTime,
    depositType: doc.depositType,
    depositValue: doc.depositValue,
    dueDate: opts.keepDates ? doc.dueDate : "",
    deliveryDate: opts.keepDates ? doc.deliveryDate : "",
    paymentMethod: doc.paymentMethod,
    depositAmount: doc.depositAmount,
  };
}

async function defaultsForInvoice(input: DocumentInput) {
  const settings = await getSettings();
  if (!input.dueDate) input.dueDate = addDays(input.date, settings.terms.paymentDelayDays);
  if (!input.paymentTerms) input.paymentTerms = settings.terms.paymentTermsText;
  return settings;
}

export async function createInvoice(raw: Partial<DocumentInput>) {
  const input = cleanInput(raw);
  validateContent(input);
  const settings = await defaultsForInvoice(input);
  const doc = blankDocument("facture", input, await snapshotFor(input.clientId), settings.company.vatExempt);
  doc.history.push(event("Facture créée (brouillon)"));
  return insertDocument(doc);
}

export async function updateInvoiceDraft(id: string, raw: Partial<DocumentInput>) {
  const doc = await load(id);
  if (doc.type === "devis") fail("Utilisez l'édition de devis.");
  if (!isEditable(doc)) fail("Document émis : il n'est plus modifiable. Utilisez un avoir pour le corriger.");
  const input = cleanInput(raw);
  // Les documents issus d'un devis gardent les lignes du devis (traçabilité).
  if (doc.quoteId || doc.type === "avoir") {
    input.lines = doc.lines;
    input.globalDiscountType = doc.globalDiscountType;
    input.globalDiscountValue = doc.globalDiscountValue;
    input.globalDiscountLabel = doc.globalDiscountLabel;
    input.shipping = doc.shipping;
    input.clientId = doc.clientId;
  }
  validateContent(input);
  if (doc.kind !== "acompte") input.depositAmount = 0;
  Object.assign(doc, input, { client: await snapshotFor(input.clientId) });
  if (doc.kind === "acompte") {
    const total = documentAmounts({ ...doc, kind: "standard", deductions: [] }).totalTtc;
    if (doc.depositAmount <= 0 || doc.depositAmount > total) fail(`L'acompte doit être compris entre 0 et ${formatEuro(total)}.`);
  }
  doc.history.push(event("Brouillon modifié"));
  return writeDocument(doc);
}

async function linkedToQuote(quoteId: string) {
  return (await listInvoices()).filter((d) => d.quoteId === quoteId && d.type === "facture");
}

export async function generateDepositInvoice(quoteId: string) {
  const quote = await load(quoteId);
  if (quote.type !== "devis" || quote.quoteStatus !== "accepte") fail("Le devis doit être accepté.");
  const amounts = documentAmounts(quote);
  if (amounts.deposit <= 0) fail("Aucun acompte n'est prévu sur ce devis.");
  const existing = (await linkedToQuote(quoteId)).find((d) => d.kind === "acompte" && d.lifecycle !== "annulee");
  if (existing) fail(`Une facture d'acompte existe déjà (${displayNumber(existing)}).`);

  const input = copyInput(quote, { keepDates: false });
  input.depositAmount = amounts.deposit;
  input.internalComments = "";
  input.paymentTerms = "";
  input.notes = "";
  await defaultsForInvoice(input);
  const doc = blankDocument("facture", input, quote.client, quote.vatExempt);
  doc.kind = "acompte";
  doc.quoteId = quoteId;
  doc.history.push(event("Facture d'acompte créée depuis le devis", quote.number ?? undefined));
  await insertDocument(doc);
  await logOnQuote(quoteId, "Facture d'acompte créée (brouillon)", formatEuro(amounts.deposit));
  return doc;
}

function depositDeductions(linked: CommercialDocument[]): Deduction[] {
  return linked
    .filter((d) => d.kind === "acompte" && d.lifecycle === "emise")
    .map((d) => {
      const a = documentAmounts(d);
      return {
        invoiceId: d.id,
        number: d.number,
        date: d.date,
        amount: a.amountDue,
        label: a.outstanding <= 0 ? "Acompte déjà versé" : "Acompte facturé",
      };
    });
}

export async function generateFinalInvoice(quoteId: string) {
  const quote = await load(quoteId);
  if (quote.type !== "devis" || quote.quoteStatus !== "accepte") fail("Le devis doit être accepté.");
  const linked = await linkedToQuote(quoteId);
  const existing = linked.find((d) => d.kind !== "acompte" && d.lifecycle !== "annulee");
  if (existing) fail(`La facture finale existe déjà (${displayNumber(existing)}).`);
  if (linked.some((d) => d.kind === "acompte" && d.lifecycle === "brouillon")) {
    fail("La facture d'acompte est encore en brouillon : émettez-la (ou supprimez-la) avant la facture finale.");
  }

  const input = copyInput(quote, { keepDates: false });
  input.deliveryDate = quote.fulfillment.deliveredAt ?? "";
  input.depositAmount = 0;
  input.internalComments = "";
  input.paymentTerms = "";
  input.notes = "";
  await defaultsForInvoice(input);
  const doc = blankDocument("facture", input, quote.client, quote.vatExempt);
  doc.deductions = depositDeductions(linked);
  doc.kind = doc.deductions.length ? "solde" : "standard";
  doc.quoteId = quoteId;
  doc.history.push(event("Facture finale créée depuis le devis", quote.number ?? undefined));
  await insertDocument(doc);
  await logOnQuote(quoteId, "Facture finale créée (brouillon)");
  return doc;
}

/** Émission : numérotation définitive, snapshots, verrouillage. */
export async function issueDocument(id: string) {
  const doc = await load(id);
  if (doc.type === "devis") fail("Un devis s'envoie, il ne s'émet pas.");
  if (doc.lifecycle !== "brouillon") fail("Ce document est déjà émis.");
  validateContent(doc);

  if (doc.type === "facture" && doc.quoteId && doc.kind !== "acompte") {
    // Les acomptes à déduire sont recalculés à l'émission (état final).
    const linked = await linkedToQuote(doc.quoteId);
    doc.deductions = depositDeductions(linked.filter((d) => d.id !== doc.id));
    doc.kind = doc.deductions.length ? "solde" : "standard";
  }
  const amounts = documentAmounts(doc);
  if (doc.type === "facture" && doc.kind !== "solde" && amounts.amountDue <= 0) fail("Le montant de la facture doit être positif.");
  if (amounts.amountDue < 0) fail("Le montant net à payer ne peut pas être négatif.");

  if (doc.type === "avoir" && doc.invoiceId) {
    const original = await load(doc.invoiceId);
    if (original.lifecycle !== "emise") fail("La facture d'origine n'est plus active.");
  }

  // Date de facture = date d'émission : garantit des numéros chronologiques.
  const draftDate = doc.date;
  doc.date = todayIso();
  if (doc.dueDate) {
    // L'échéance garde son délai relatif à la date du brouillon.
    const delay = Math.round((Date.parse(doc.dueDate) - Date.parse(draftDate)) / 86_400_000);
    doc.dueDate = addDays(doc.date, Math.max(0, delay));
  }
  await freeze(doc);
  doc.number = await allocateNumber(doc.type, doc.date);
  doc.lifecycle = "emise";
  doc.issuedAt = new Date().toISOString();
  const label = documentTitle(doc);
  doc.history.push(event(`${label} émise`, `${doc.number} — ${formatEuro(amounts.amountDue)}`));
  await writeDocument(doc);

  if (doc.type === "avoir" && doc.invoiceId) {
    const original = await load(doc.invoiceId);
    original.lifecycle = "annulee";
    original.creditNoteId = doc.id;
    original.history.push(event("Facture annulée par avoir", doc.number ?? undefined));
    await writeDocument(original);
    await logOnQuote(original.quoteId, `Avoir ${doc.number} émis`, `Annule ${original.number}`);
  } else {
    await logOnQuote(doc.quoteId, `${label} émise`, `${doc.number} — ${formatEuro(amounts.amountDue)}`);
  }
  return doc;
}

export async function markDocumentSent(id: string, detail?: string) {
  const doc = await load(id);
  if (doc.type === "devis") return markQuoteSent(id, detail);
  if (doc.lifecycle === "brouillon") fail("Émettez le document avant de l'envoyer.");
  doc.sentAt = new Date().toISOString();
  doc.history.push(event(`${documentTitle(doc)} envoyée`, detail));
  return writeDocument(doc);
}

// ── Paiements ──────────────────────────────────────────────────────────────

export async function recordPayment(id: string, raw: Partial<Payment>) {
  const doc = await load(id);
  if (doc.type !== "facture") fail("Les paiements s'enregistrent sur une facture.");
  if (doc.lifecycle !== "emise") fail("Seule une facture émise (non annulée) peut recevoir un paiement.");
  const amount = money(raw.amount);
  if (amount <= 0) fail("Le montant du paiement doit être positif.");
  const before = documentAmounts(doc);
  if (amount > before.outstanding + 0.001) fail(`Le paiement dépasse le reste à payer (${formatEuro(before.outstanding)}).`);

  const payment: Payment = {
    id: randomUUID(),
    date: date(raw.date) || todayIso(),
    amount,
    method: PAYMENT_METHODS.includes(raw.method as never) ? raw.method! : "virement",
    reference: text(raw.reference, 200),
    comment: text(raw.comment, 1000),
    createdAt: new Date().toISOString(),
  };
  doc.payments.push(payment);
  const after = documentAmounts(doc);
  doc.history.push(event("Paiement enregistré", `${formatEuro(amount)} le ${frDate(payment.date)}`));
  if (after.outstanding <= 0) doc.history.push(event(`${documentTitle(doc)} payée`));
  await writeDocument(doc);
  await logOnQuote(
    doc.quoteId,
    after.outstanding <= 0 ? `${documentTitle(doc)} ${doc.number} payée` : `Paiement reçu sur ${doc.number}`,
    formatEuro(amount),
  );
  return doc;
}

export async function deletePayment(id: string, paymentId: string) {
  const doc = await load(id);
  const payment = doc.payments.find((p) => p.id === paymentId) ?? fail("Paiement introuvable.");
  doc.payments = doc.payments.filter((p) => p.id !== paymentId);
  doc.history.push(event("Paiement supprimé", `${formatEuro(payment.amount)} du ${frDate(payment.date)}`));
  return writeDocument(doc);
}

// ── Avoirs, rectificatives, duplication ────────────────────────────────────

export async function createCreditNote(invoiceId: string, reason: string) {
  const invoice = await load(invoiceId);
  if (invoice.type !== "facture" || invoice.lifecycle !== "emise") fail("Seule une facture émise peut être annulée par un avoir.");
  const pending = (await listInvoices()).find(
    (d) => d.type === "avoir" && d.invoiceId === invoiceId && d.lifecycle === "brouillon",
  );
  if (pending) return pending;

  const a = documentAmounts(invoice);
  const input = copyInput(invoice, { keepDates: false });
  if (invoice.kind !== "standard") {
    // Acompte / solde : l'avoir porte exactement le montant facturé.
    input.lines = [
      {
        id: randomUUID(),
        label: `Annulation de la facture ${invoice.number}`,
        description: invoice.subject,
        quantity: 1,
        unitPriceHt: a.amountDueHt,
        vatRate: a.amountDueVat > 0 && a.amountDueHt > 0 ? round2((a.amountDueVat / a.amountDueHt) * 100) : 0,
        discountType: "amount",
        discountValue: 0,
      },
    ];
    input.globalDiscountValue = 0;
    input.shipping = 0;
  }
  input.paymentTerms = "";
  input.notes = "";
  input.depositAmount = 0;
  const doc = blankDocument("avoir", input, invoice.client, invoice.vatExempt);
  doc.invoiceId = invoiceId;
  doc.quoteId = invoice.quoteId;
  doc.reason = text(reason, 500) || "Annulation de la facture";
  doc.history.push(event("Avoir créé (brouillon)", `Sur la facture ${invoice.number}`));
  await insertDocument(doc);
  invoice.history.push(event("Avoir en préparation"));
  await writeDocument(invoice);
  return doc;
}

/** Facture rectificative : copie modifiable d'une facture annulée par avoir. */
export async function createCorrectiveInvoice(invoiceId: string) {
  const original = await load(invoiceId);
  if (original.type !== "facture" || original.lifecycle !== "annulee" || !original.creditNoteId) {
    fail("Annulez d'abord la facture par un avoir émis.");
  }
  const input = copyInput(original, { keepDates: false });
  input.dueDate = "";
  await defaultsForInvoice(input);
  const doc = blankDocument("facture", input, original.client, original.vatExempt);
  doc.kind = original.kind;
  doc.quoteId = original.quoteId;
  doc.correctsId = original.id;
  doc.deductions = original.deductions;
  doc.history.push(event("Facture rectificative créée", `Remplace ${original.number}`));
  await insertDocument(doc);
  await logOnQuote(original.quoteId, "Facture rectificative créée (brouillon)", `Remplace ${original.number}`);
  return doc;
}

export async function duplicateDocument(id: string) {
  const source = await load(id);
  const input = copyInput(source, { keepDates: false });
  if (source.type === "devis") {
    const copy = await createQuote(input);
    copy.history.push(event("Dupliqué depuis", source.number ?? undefined));
    return writeDocument(copy);
  }
  if (source.type === "avoir") fail("Un avoir ne se duplique pas.");
  // Copie autonome : sans lien devis, montant complet.
  input.depositAmount = 0;
  const copy = await createInvoice(input);
  copy.history.push(event("Dupliquée depuis", displayNumber(source)));
  return writeDocument(copy);
}

export async function setArchived(id: string, archived: boolean) {
  const doc = await load(id);
  if (doc.archived === archived) return doc;
  doc.archived = archived;
  doc.history.push(event(archived ? "Archivé" : "Désarchivé"));
  return writeDocument(doc);
}

/** Suppression physique : brouillons uniquement (un document émis s'archive). */
export async function deleteDraft(id: string) {
  const doc = await load(id);
  const deletable = doc.type === "devis" ? doc.quoteStatus === "brouillon" : doc.lifecycle === "brouillon";
  if (!deletable) fail("Un document envoyé ou émis ne peut pas être supprimé : archivez-le.");
  await removeDocument(id);
  await logOnQuote(doc.quoteId, `${documentTitle(doc)} (brouillon) supprimée`);
  if (doc.type === "avoir" && doc.invoiceId) {
    const invoice = await getDocument(doc.invoiceId);
    if (invoice) {
      invoice.history.push(event("Avoir en préparation abandonné"));
      await writeDocument(invoice);
    }
  }
  return doc;
}

export async function setAdminPdf(id: string, pdfUrl: string) {
  const doc = await load(id);
  doc.pdfUrl = pdfUrl;
  return writeDocument(doc);
}

// ── Lecture ────────────────────────────────────────────────────────────────

/** Toute la chaîne commerciale d'un document (devis, versions, factures, avoirs). */
export async function linkedDocuments(doc: CommercialDocument): Promise<CommercialDocument[]> {
  const all = await listInvoices();
  const byId = new Map(all.map((d) => [d.id, d]));
  const rootQuoteId = doc.type === "devis" ? doc.id : doc.quoteId;
  const ids = new Set<string>();

  if (rootQuoteId) {
    ids.add(rootQuoteId);
    // Versions successives du devis.
    let cur = byId.get(rootQuoteId);
    while (cur?.revisionOf && !ids.has(cur.revisionOf)) {
      ids.add(cur.revisionOf);
      cur = byId.get(cur.revisionOf);
    }
    cur = byId.get(rootQuoteId);
    while (cur?.replacedBy && !ids.has(cur.replacedBy)) {
      ids.add(cur.replacedBy);
      cur = byId.get(cur.replacedBy);
    }
    for (const d of all) if (d.quoteId === rootQuoteId) ids.add(d.id);
  }
  ids.add(doc.id);
  for (const d of all) {
    if (d.invoiceId && ids.has(d.invoiceId)) ids.add(d.id);
    if (d.correctsId && ids.has(d.correctsId)) ids.add(d.id);
  }
  if (doc.invoiceId) ids.add(doc.invoiceId);
  if (doc.correctsId) ids.add(doc.correctsId);

  return [...ids]
    .map((i) => byId.get(i))
    .filter((d): d is CommercialDocument => !!d)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}


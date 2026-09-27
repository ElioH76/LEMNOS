import { documentAmounts, invoiceStatus, quoteStatus, round2, todayIso } from "./calc";
import { INVOICE_STATUSES, type CommercialDocument, type InvoiceStatus } from "./types";

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
export { MONTH_LABELS };

/**
 * Indicateurs de la gestion commerciale. Fonctions pures (dashboard + page
 * Statistiques).
 *
 * - CA facturé : factures émises (y compris celles annulées depuis) moins les
 *   avoirs émis → une facture annulée par avoir s'annule d'elle-même. Acompte
 *   + solde s'additionnent sans double compte (le solde est net des acomptes).
 * - CA encaissé : somme des paiements, à leur date.
 */
export interface BillingStats {
  /** CA facturé (net d'avoirs). */
  invoicedTotal: number;
  invoicedYear: number;
  /** Encaissements. */
  collectedTotal: number;
  collectedYear: number;
  collectedMonth: number;
  /** Encaissements mois par mois de l'année en cours (12 valeurs). */
  monthly: number[];
  /** Factures émises non soldées. */
  unpaidCount: number;
  unpaidAmount: number;
  lateCount: number;
  lateAmount: number;
  /** Factures d'acompte émises restant à encaisser. */
  depositsDueCount: number;
  depositsDueAmount: number;
  /** Devis envoyés en attente de réponse (non expirés). */
  pendingQuotes: number;
  /** Devis acceptés dont la facturation n'est pas terminée. */
  acceptedQuotes: number;
  /** Montant TTC des devis en cours (brouillons + envoyés). */
  openQuotesAmount: number;
  /** Rétrocompatibilité (anciennes tuiles). */
  caMonth: number;
  caYear: number;
  caTotal: number;
}

export function computeBillingStats(docs: CommercialDocument[], now = new Date()): BillingStats {
  const today = todayIso(now);
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthly = new Array(12).fill(0);
  const s = {
    invoicedTotal: 0,
    invoicedYear: 0,
    collectedTotal: 0,
    collectedYear: 0,
    collectedMonth: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
    lateCount: 0,
    lateAmount: 0,
    depositsDueCount: 0,
    depositsDueAmount: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    openQuotesAmount: 0,
  };

  const finalInvoicedQuotes = new Set(
    docs
      .filter((d) => d.type === "facture" && d.quoteId && d.kind !== "acompte" && d.lifecycle === "emise")
      .map((d) => d.quoteId),
  );

  for (const doc of docs) {
    const a = documentAmounts(doc);

    if (doc.type === "devis") {
      const st = quoteStatus(doc, today);
      if (st === "envoye") s.pendingQuotes += 1;
      if (st === "brouillon" || st === "envoye") s.openQuotesAmount += a.totalTtc;
      if (st === "accepte" && !finalInvoicedQuotes.has(doc.id)) s.acceptedQuotes += 1;
      continue;
    }
    if (doc.lifecycle === "brouillon") continue;

    const sign = doc.type === "avoir" ? -1 : 1;
    s.invoicedTotal += sign * a.amountDue;
    if (doc.date.startsWith(String(year))) s.invoicedYear += sign * a.amountDue;

    if (doc.type !== "facture") continue;
    for (const p of doc.payments) {
      s.collectedTotal += p.amount;
      const [py, pm] = p.date.split("-").map(Number);
      if (py === year) {
        s.collectedYear += p.amount;
        monthly[pm - 1] += p.amount;
        if (pm - 1 === month) s.collectedMonth += p.amount;
      }
    }

    const st = invoiceStatus(doc, today);
    if (st === "non_payee" || st === "partielle" || st === "en_retard") {
      s.unpaidCount += 1;
      s.unpaidAmount += a.outstanding;
      if (st === "en_retard") {
        s.lateCount += 1;
        s.lateAmount += a.outstanding;
      }
      if (doc.kind === "acompte") {
        s.depositsDueCount += 1;
        s.depositsDueAmount += a.outstanding;
      }
    }
  }

  const r = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, round2(v)])) as typeof s;
  return {
    ...r,
    monthly: monthly.map(round2),
    caMonth: r.collectedMonth,
    caYear: r.collectedYear,
    caTotal: r.collectedTotal,
  };
}

export interface InvoiceAnalytics {
  /** Nombre de factures (hors devis et avoirs). */
  invoiceCount: number;
  countByStatus: Record<InvoiceStatus, number>;
  /** Montant par statut : encaissé pour « payée », reste dû sinon. */
  amountByStatus: Record<InvoiceStatus, number>;
  avgPaidInvoice: number;
  /** Factures payées / factures émises actives, en %. */
  collectionRate: number;
}

export function computeInvoiceAnalytics(docs: CommercialDocument[]): InvoiceAnalytics {
  const countByStatus = Object.fromEntries(INVOICE_STATUSES.map((k) => [k, 0])) as Record<InvoiceStatus, number>;
  const amountByStatus = { ...countByStatus };
  let invoiceCount = 0;
  let paidTotal = 0;

  for (const doc of docs) {
    if (doc.type !== "facture") continue;
    invoiceCount += 1;
    const st = invoiceStatus(doc);
    const a = documentAmounts(doc);
    countByStatus[st] += 1;
    amountByStatus[st] += st === "payee" ? a.paid : st === "annulee" || st === "brouillon" ? a.amountDue : a.outstanding;
    if (st === "payee") paidTotal += a.amountDue;
  }
  for (const k of INVOICE_STATUSES) amountByStatus[k] = round2(amountByStatus[k]);

  const paid = countByStatus.payee;
  const active = paid + countByStatus.non_payee + countByStatus.partielle + countByStatus.en_retard;
  return {
    invoiceCount,
    countByStatus,
    amountByStatus,
    avgPaidInvoice: paid > 0 ? round2(paidTotal / paid) : 0,
    collectionRate: active > 0 ? Math.round((paid / active) * 100) : 0,
  };
}

export interface ClientRevenue {
  key: string;
  clientId: string | null;
  name: string;
  /** CA encaissé. */
  caPaid: number;
  /** Nombre de factures émises. */
  invoiceCount: number;
}

export function topClientsByRevenue(docs: CommercialDocument[], limit = 8): ClientRevenue[] {
  const map = new Map<string, ClientRevenue>();
  for (const doc of docs) {
    if (doc.type !== "facture" || doc.lifecycle === "brouillon") continue;
    const name = doc.client.club?.trim() || "—";
    const key = doc.clientId || name.toLowerCase();
    const entry = map.get(key) ?? { key, clientId: doc.clientId ?? null, name, caPaid: 0, invoiceCount: 0 };
    entry.invoiceCount += 1;
    entry.caPaid += documentAmounts(doc).paid;
    map.set(key, entry);
  }
  return [...map.values()]
    .map((c) => ({ ...c, caPaid: round2(c.caPaid) }))
    .sort((a, b) => b.caPaid - a.caPaid || b.invoiceCount - a.invoiceCount)
    .slice(0, limit);
}

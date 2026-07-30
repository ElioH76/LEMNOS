import { computeTotals, round2 } from "./calc";
import type { Invoice, InvoiceStatus } from "./types";

export interface BillingStats {
  /** CA encaissé (factures payées) sur le mois en cours. */
  caMonth: number;
  /** CA encaissé sur l'année en cours. */
  caYear: number;
  /** CA encaissé total. */
  caTotal: number;
  /** CA payé mois par mois pour l'année en cours (12 valeurs, jan→déc). */
  monthly: number[];
  /** Factures envoyées non réglées : nombre et reste à payer cumulé. */
  unpaidCount: number;
  unpaidAmount: number;
  /** Devis en attente (brouillon ou envoyé). */
  pendingQuotes: number;
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
export { MONTH_LABELS };

/** Agrège les indicateurs de facturation. Pur → réutilisable (dashboard + stats). */
export function computeBillingStats(invoices: Invoice[], now = new Date()): BillingStats {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthly = new Array(12).fill(0);

  let caTotal = 0;
  let caYear = 0;
  let caMonth = 0;
  let unpaidCount = 0;
  let unpaidAmount = 0;
  let pendingQuotes = 0;

  for (const inv of invoices) {
    const totals = computeTotals(inv);

    if (inv.documentType === "devis") {
      if (inv.status === "brouillon" || inv.status === "envoyee") pendingQuotes += 1;
      continue;
    }

    if (inv.status === "envoyee") {
      unpaidCount += 1;
      unpaidAmount += totals.remaining;
    }

    if (inv.status === "payee") {
      const d = new Date(inv.date);
      caTotal += totals.totalTtc;
      if (d.getFullYear() === year) {
        caYear += totals.totalTtc;
        monthly[d.getMonth()] += totals.totalTtc;
        if (d.getMonth() === month) caMonth += totals.totalTtc;
      }
    }
  }

  return {
    caMonth: round2(caMonth),
    caYear: round2(caYear),
    caTotal: round2(caTotal),
    monthly: monthly.map(round2),
    unpaidCount,
    unpaidAmount: round2(unpaidAmount),
    pendingQuotes,
  };
}

export interface InvoiceAnalytics {
  /** Nombre de factures (hors devis). */
  invoiceCount: number;
  /** Répartition des factures par statut (nombre). */
  countByStatus: Record<InvoiceStatus, number>;
  /** Montant TTC cumulé par statut (payées = encaissé, envoyées = reste dû). */
  amountByStatus: Record<InvoiceStatus, number>;
  /** Panier moyen d'une facture payée. */
  avgPaidInvoice: number;
  /** Taux de règlement = payées / (payées + envoyées), en % (0 si aucune). */
  collectionRate: number;
}

const EMPTY_STATUS_MAP = (): Record<InvoiceStatus, number> => ({
  brouillon: 0,
  envoyee: 0,
  payee: 0,
  annulee: 0,
});

/**
 * Analyse détaillée des factures (répartition par statut, panier moyen, taux de
 * règlement). Complète `computeBillingStats` sans la modifier. Pur → réutilisable.
 */
export function computeInvoiceAnalytics(invoices: Invoice[]): InvoiceAnalytics {
  const countByStatus = EMPTY_STATUS_MAP();
  const amountByStatus = EMPTY_STATUS_MAP();
  let invoiceCount = 0;
  let paidTotal = 0;

  for (const inv of invoices) {
    if (inv.documentType === "devis") continue;
    invoiceCount += 1;
    const totals = computeTotals(inv);
    countByStatus[inv.status] += 1;
    amountByStatus[inv.status] +=
      inv.status === "payee"
        ? totals.totalTtc
        : inv.status === "envoyee"
          ? totals.remaining
          : totals.totalTtc;
    if (inv.status === "payee") paidTotal += totals.totalTtc;
  }

  for (const k of Object.keys(amountByStatus) as InvoiceStatus[]) {
    amountByStatus[k] = round2(amountByStatus[k]);
  }

  const paid = countByStatus.payee;
  const settleable = paid + countByStatus.envoyee;

  return {
    invoiceCount,
    countByStatus,
    amountByStatus,
    avgPaidInvoice: paid > 0 ? round2(paidTotal / paid) : 0,
    collectionRate: settleable > 0 ? Math.round((paid / settleable) * 100) : 0,
  };
}

export interface ClientRevenue {
  /** Clé de regroupement (clientId si présent, sinon nom normalisé). */
  key: string;
  /** Fiche client liée, si la facture pointe vers une (pour un lien direct). */
  clientId: string | null;
  name: string;
  /** CA encaissé (factures payées). */
  caPaid: number;
  /** Nombre de factures (hors devis). */
  invoiceCount: number;
}

/**
 * Classe les clients par CA encaissé décroissant. Regroupe par `clientId` quand
 * il existe, sinon par nom de club (repli, comme le reste du CRM).
 */
export function topClientsByRevenue(invoices: Invoice[], limit = 8): ClientRevenue[] {
  const map = new Map<string, ClientRevenue>();

  for (const inv of invoices) {
    if (inv.documentType === "devis") continue;
    const name = inv.client.club?.trim() || "—";
    const key = inv.clientId || name.toLowerCase();
    const entry = map.get(key) ?? { key, clientId: inv.clientId ?? null, name, caPaid: 0, invoiceCount: 0 };
    entry.name = name || entry.name;
    if (!entry.clientId && inv.clientId) entry.clientId = inv.clientId;
    entry.invoiceCount += 1;
    if (inv.status === "payee") entry.caPaid += computeTotals(inv).totalTtc;
    map.set(key, entry);
  }

  return [...map.values()]
    .map((c) => ({ ...c, caPaid: round2(c.caPaid) }))
    .sort((a, b) => b.caPaid - a.caPaid || b.invoiceCount - a.invoiceCount)
    .slice(0, limit);
}

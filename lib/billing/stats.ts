import { computeTotals, round2 } from "./calc";
import type { Invoice } from "./types";

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

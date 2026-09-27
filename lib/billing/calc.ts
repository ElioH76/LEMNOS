import type {
  CommercialDocument,
  DepositType,
  DiscountType,
  DocumentLine,
  InvoiceStatus,
  QuoteStatus,
} from "./types";

/**
 * Calculs de la gestion commerciale. Fonctions pures, partagées par le
 * formulaire (temps réel), les pages admin, le PDF et les statistiques : un
 * seul endroit fait foi pour chaque montant.
 */

/** Arrondi 2 décimales, sûr pour la monnaie. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
}

/** « 20 % » ou « 12,50 € ». */
export function formatDiscount(type: DiscountType, value: number): string {
  return type === "percent"
    ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value)} %`
    : formatEuro(value);
}

function applyDiscount(base: number, type: DiscountType, value: number): number {
  if (!value || value < 0) return 0;
  return type === "percent" ? (base * Math.min(value, 100)) / 100 : value;
}

/** Montant brut d'une ligne (quantité × prix unitaire). */
export function lineGross(line: Pick<DocumentLine, "quantity" | "unitPriceHt">): number {
  return round2((line.quantity || 0) * (line.unitPriceHt || 0));
}

/** Montant HT d'une ligne, remise de ligne déduite (jamais négatif). */
export function lineHt(line: DocumentLine): number {
  const base = lineGross(line);
  return Math.max(0, round2(base - applyDiscount(base, line.discountType, line.discountValue)));
}

export interface TotalsInput {
  lines: DocumentLine[];
  shipping: number;
  globalDiscountType: DiscountType;
  globalDiscountValue: number;
  vatExempt: boolean;
  depositType?: DepositType;
  depositValue?: number;
  /** Taux de TVA des frais de livraison hors franchise (défaut 20 %). */
  shippingVatRate?: number;
}

export interface Totals {
  /** Somme des lignes nettes (avant remise globale) — « Sous-total ». */
  subtotal: number;
  /** Remise globale en euros. */
  globalDiscount: number;
  /** HT après remise globale, hors livraison. */
  netHt: number;
  shipping: number;
  totalHt: number;
  /** TVA par taux, ex. { "20": 12.34 }. Vide en franchise en base. */
  vatByRate: Record<string, number>;
  totalVat: number;
  totalTtc: number;
  /** Acompte demandé (devis). */
  deposit: number;
  /** Solde après acompte (devis). */
  balance: number;
}

/**
 * Totaux d'une commande. La remise globale est répartie au prorata des lignes
 * pour que la TVA par taux reste exacte hors franchise.
 */
export function computeTotals(input: TotalsInput): Totals {
  const subtotal = round2(input.lines.reduce((sum, l) => sum + lineHt(l), 0));
  const globalDiscount = round2(
    Math.min(subtotal, applyDiscount(subtotal, input.globalDiscountType, input.globalDiscountValue)),
  );
  const netHt = round2(subtotal - globalDiscount);
  const shipping = round2(Math.max(0, input.shipping || 0));

  const vatByRate: Record<string, number> = {};
  if (!input.vatExempt) {
    const ratio = subtotal > 0 ? netHt / subtotal : 0;
    for (const line of input.lines) {
      const rate = line.vatRate || 0;
      if (rate <= 0) continue;
      vatByRate[rate] = (vatByRate[rate] ?? 0) + (lineHt(line) * ratio * rate) / 100;
    }
    const shippingRate = input.shippingVatRate ?? 20;
    if (shipping > 0 && shippingRate > 0) {
      vatByRate[shippingRate] = (vatByRate[shippingRate] ?? 0) + (shipping * shippingRate) / 100;
    }
    for (const k of Object.keys(vatByRate)) vatByRate[k] = round2(vatByRate[k]);
  }

  const totalHt = round2(netHt + shipping);
  const totalVat = round2(Object.values(vatByRate).reduce((s, v) => s + v, 0));
  const totalTtc = round2(totalHt + totalVat);
  const deposit = depositFor(totalTtc, input.depositType ?? "none", input.depositValue ?? 0);

  return {
    subtotal,
    globalDiscount,
    netHt,
    shipping,
    totalHt,
    vatByRate,
    totalVat,
    totalTtc,
    deposit,
    balance: round2(totalTtc - deposit),
  };
}

/** Acompte demandé sur un total TTC. */
export function depositFor(totalTtc: number, type: DepositType, value: number): number {
  if (type === "none" || !value || value < 0) return 0;
  if (type === "percent") return round2((totalTtc * Math.min(value, 100)) / 100);
  return round2(Math.min(value, totalTtc));
}

export interface DocumentAmounts extends Totals {
  /** Acomptes déjà facturés, déduits (facture de solde). */
  deductionsTotal: number;
  /**
   * Montant facturé par CE document = ce que le client doit payer :
   * - devis : total TTC ;
   * - facture standard / avoir : total TTC ;
   * - facture d'acompte : montant de l'acompte ;
   * - facture de solde : total TTC − acomptes déjà facturés.
   */
  amountDue: number;
  /** Part HT / TVA du montant facturé (acompte : au prorata). */
  amountDueHt: number;
  amountDueVat: number;
  paid: number;
  outstanding: number;
}

export function documentAmounts(doc: CommercialDocument): DocumentAmounts {
  const totals = computeTotals({
    lines: doc.lines,
    shipping: doc.shipping,
    globalDiscountType: doc.globalDiscountType,
    globalDiscountValue: doc.globalDiscountValue,
    vatExempt: doc.vatExempt,
    depositType: doc.type === "devis" ? doc.depositType : "none",
    depositValue: doc.depositValue,
  });

  const deductionsTotal = round2(doc.deductions.reduce((s, d) => s + (d.amount || 0), 0));
  let amountDue = totals.totalTtc;
  if (doc.type === "facture" && doc.kind === "acompte") {
    amountDue = round2(Math.min(Math.max(0, doc.depositAmount || 0), totals.totalTtc));
  } else if (doc.type === "facture") {
    amountDue = round2(totals.totalTtc - deductionsTotal);
  }

  const ratio = totals.totalTtc > 0 ? amountDue / totals.totalTtc : 0;
  const amountDueVat = round2(totals.totalVat * ratio);
  const amountDueHt = round2(amountDue - amountDueVat);

  const paid = round2(doc.payments.reduce((s, p) => s + (p.amount || 0), 0));
  return {
    ...totals,
    deductionsTotal,
    amountDue,
    amountDueHt,
    amountDueVat,
    paid,
    outstanding: round2(Math.max(0, amountDue - paid)),
  };
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

/** Statut affiché d'une facture (dérivé des paiements et de l'échéance). */
export function invoiceStatus(doc: CommercialDocument, today = todayIso()): InvoiceStatus {
  if (doc.lifecycle === "brouillon") return "brouillon";
  if (doc.lifecycle === "annulee") return "annulee";
  const a = documentAmounts(doc);
  if (a.amountDue > 0 && a.outstanding <= 0) return "payee";
  if (a.amountDue <= 0) return "payee";
  if (doc.dueDate && doc.dueDate < today) return "en_retard";
  if (a.paid > 0) return "partielle";
  return "non_payee";
}

/** Statut effectif d'un devis : un devis envoyé dont la validité est dépassée est expiré. */
export function quoteStatus(doc: CommercialDocument, today = todayIso()): QuoteStatus {
  if (doc.quoteStatus === "envoye" && doc.validUntil && doc.validUntil < today) return "expire";
  return doc.quoteStatus;
}

/** Un document peut-il encore être modifié librement ? */
export function isEditable(doc: CommercialDocument): boolean {
  if (doc.type === "devis") return doc.quoteStatus === "brouillon";
  return doc.lifecycle === "brouillon";
}

// ── Montant en lettres ─────────────────────────────────────────────────────

const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    const base = t === 7 ? "soixante" : "quatre-vingt";
    const rest = 10 + u;
    const joiner = t === 7 && u === 1 ? "-et-" : "-";
    return `${base}${joiner}${UNITS[rest]}`;
  }
  if (t === 8) return u === 0 ? "quatre-vingts" : `quatre-vingt-${UNITS[u]}`;
  if (u === 0) return TENS[t];
  if (u === 1) return `${TENS[t]}-et-un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h === 1) parts.push("cent");
  else if (h > 1) parts.push(r === 0 ? `${UNITS[h]} cents` : `${UNITS[h]} cent`);
  if (r > 0 || h === 0) parts.push(below100(r));
  return parts.join(" ");
}

/** Entier en toutes lettres (orthographe traditionnelle). */
export function integerToFrench(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n < 1000) return below1000(n);
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    let head = th === 1 ? "mille" : `${below1000(th)} mille`;
    head = head.replace(/cents mille$/, "cent mille").replace(/quatre-vingts mille$/, "quatre-vingt mille");
    return rest ? `${head} ${below1000(rest)}` : head;
  }
  const m = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const head = m === 1 ? "un million" : `${integerToFrench(m)} millions`;
  return rest ? `${head} ${integerToFrench(rest)}` : head;
}

/** « Quatre cent quatre-vingts euros » / « … euros et cinquante centimes ». */
export function amountInWords(amount: number): string {
  const value = round2(Math.abs(amount));
  const euros = Math.floor(value);
  const cents = Math.round((value - euros) * 100);
  let text = `${integerToFrench(euros)} euro${euros > 1 ? "s" : ""}`;
  if (euros >= 1_000_000 && euros % 1_000_000 === 0) text = text.replace(/ euros$/, " d'euros");
  if (cents > 0) text += ` et ${integerToFrench(cents)} centime${cents > 1 ? "s" : ""}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « 27/09/2026 » (tiret cadratin si vide). */
export function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : "—";
}

/** « 27/09/2026 à 14:05 » pour les horodatages ISO. */
export function frDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
}

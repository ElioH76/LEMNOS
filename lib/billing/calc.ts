import type { DiscountType, InvoiceLine } from "./types";

/** Arrondi 2 décimales, sûr pour la monnaie. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
}

function applyDiscount(base: number, type: DiscountType, value: number): number {
  if (!value) return 0;
  return type === "percent" ? (base * value) / 100 : value;
}

/** Total HT d'une ligne, remise de ligne déduite (jamais négatif). */
export function lineHt(line: InvoiceLine): number {
  const base = (line.quantity || 0) * (line.unitPriceHt || 0);
  const discount = applyDiscount(base, line.discountType, line.discountValue);
  return Math.max(0, round2(base - discount));
}

export interface TotalsInput {
  lines: InvoiceLine[];
  shipping: number;
  globalDiscountType: DiscountType;
  globalDiscountValue: number;
  deposit: number;
  /** Taux de TVA appliqué aux frais de livraison (défaut 20 %). */
  shippingVatRate?: number;
}

export interface Totals {
  /** HT des lignes, avant remise globale. */
  linesHt: number;
  /** Remise globale en euros. */
  globalDiscount: number;
  /** HT après remise globale (hors livraison). */
  netHt: number;
  shipping: number;
  /** HT total (lignes nettes + livraison). */
  totalHt: number;
  /** TVA par taux, ex. { 20: 12.34, 5.5: 1.2 }. */
  vatByRate: Record<string, number>;
  totalVat: number;
  totalTtc: number;
  deposit: number;
  remaining: number;
}

/**
 * Calcule tous les totaux. La remise globale est répartie au prorata du HT de
 * chaque ligne, pour que la TVA par taux reste exacte.
 */
export function computeTotals(input: TotalsInput): Totals {
  const linesHt = round2(input.lines.reduce((sum, l) => sum + lineHt(l), 0));
  const globalDiscount = round2(
    Math.min(linesHt, applyDiscount(linesHt, input.globalDiscountType, input.globalDiscountValue)),
  );
  const netHt = round2(linesHt - globalDiscount);
  const ratio = linesHt > 0 ? netHt / linesHt : 0;

  const vatByRate: Record<string, number> = {};
  for (const line of input.lines) {
    const net = lineHt(line) * ratio;
    const rate = line.vatRate || 0;
    vatByRate[rate] = (vatByRate[rate] ?? 0) + (net * rate) / 100;
  }

  const shipping = round2(input.shipping || 0);
  const shippingVatRate = input.shippingVatRate ?? 20;
  if (shipping > 0 && shippingVatRate > 0) {
    vatByRate[shippingVatRate] =
      (vatByRate[shippingVatRate] ?? 0) + (shipping * shippingVatRate) / 100;
  }

  for (const key of Object.keys(vatByRate)) vatByRate[key] = round2(vatByRate[key]);

  const totalHt = round2(netHt + shipping);
  const totalVat = round2(Object.values(vatByRate).reduce((s, v) => s + v, 0));
  const totalTtc = round2(totalHt + totalVat);
  const deposit = round2(input.deposit || 0);
  const remaining = round2(totalTtc - deposit);

  return {
    linesHt,
    globalDiscount,
    netHt,
    shipping,
    totalHt,
    vatByRate,
    totalVat,
    totalTtc,
    deposit,
    remaining,
  };
}

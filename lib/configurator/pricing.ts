import type { DesignConfig } from "./types";

/**
 * Tarification configurable. Aucun tarif public n'est défini à ce jour : tant
 * que `unitPriceHT` vaut `null`, l'interface affiche « Tarif sur devis » et
 * n'invente aucun prix. Pour publier une grille, renseigner les montants (€ HT)
 * — l'estimation s'affiche alors automatiquement dans le récapitulatif.
 */
export const PRICING = {
  currency: "EUR",
  /** Prix unitaire de base du maillot, € HT. */
  unitPriceHT: null as number | null,
  /** Supplément par logo client (club / sponsor), € HT par pièce. */
  perLogoHT: null as number | null,
  /** Supplément flocage nom + numéro, € HT par pièce. */
  playerTextHT: null as number | null,
  minimumQuantity: 10,
};

export type PriceEstimate = { available: false } | { available: true; unitHT: number };

export function estimateUnitPrice(design: DesignConfig): PriceEstimate {
  if (PRICING.unitPriceHT === null) return { available: false };
  const unit =
    PRICING.unitPriceHT +
    (PRICING.perLogoHT ?? 0) * design.customLogos.length +
    (design.playerText.enabled ? (PRICING.playerTextHT ?? 0) : 0);
  return { available: true, unitHT: Math.round(unit * 100) / 100 };
}

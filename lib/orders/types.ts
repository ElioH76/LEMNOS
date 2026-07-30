/**
 * Types du module Workflow de commande (module 4).
 *
 * Une commande suit un pipeline linéaire de 5 états. Chaque changement d'état
 * est horodaté dans `events` : c'est la timeline visible côté admin. Le modèle
 * garde des liens optionnels vers la fiche client (`clientId`) et une facture
 * (`invoiceId`), tout en figeant le nom du client (`clientName`) pour rester
 * lisible même si la fiche disparaît — même logique de snapshot que la facture.
 *
 * Aucune infrastructure nouvelle : stockage jsonb via lib/orders/store.ts.
 */

export type OrderStatus =
  | "design"
  | "validation"
  | "production"
  | "expedition"
  | "livre";

/** Ordre du pipeline — sert au stepper, à la progression « étape suivante ». */
export const ORDER_STATUSES: OrderStatus[] = [
  "design",
  "validation",
  "production",
  "expedition",
  "livre",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  design: "Design",
  validation: "Validation client",
  production: "Production",
  expedition: "Expédition",
  livre: "Livré",
};

/** Libellé court pour les zones denses (stepper compact, badges de carte). */
export const ORDER_STATUS_SHORT: Record<OrderStatus, string> = {
  design: "Design",
  validation: "Validation",
  production: "Production",
  expedition: "Expédition",
  livre: "Livré",
};

/**
 * Badges — palette de la DA. Progression lisible du clair (début) au vert
 * (livré, l'étape aboutie, cohérent avec « payée » côté facturation) : le vert
 * doux marque « Validation client », l'action attendue du client.
 */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  design: "bg-status-design-bg text-status-design-fg",
  validation: "bg-green-soft text-green",
  production: "bg-status-production-bg text-status-production-fg",
  expedition: "bg-ink text-white",
  livre: "bg-green text-white",
};

/** Un jalon de la timeline : passage à un état, horodaté, avec note optionnelle. */
export interface OrderEvent {
  id: string;
  status: OrderStatus;
  at: string; // ISO
  note?: string;
}

/** Champs saisis dans le formulaire (sans identité, numéro ni avancement). */
export interface OrderInput {
  /** Lien optionnel vers une fiche client enregistrée. */
  clientId: string | null;
  /** Nom du club/entreprise, figé sur la commande. */
  clientName: string;
  /** Libellé de la commande, ex. « FC Littoral — Équipement Senior 2026/2027 ». */
  title: string;
  sport: string;
  quantity: string;
  /** Date de livraison prévue (yyyy-mm-dd). */
  dueDate: string;
  /** Lien optionnel vers une facture. */
  invoiceId: string | null;
  notes: string;
}

export interface Order extends OrderInput {
  id: string;
  number: string; // CMD-2026-0001
  status: OrderStatus;
  events: OrderEvent[];
  createdAt: string;
  updatedAt: string;
}

/** Indice de l'état dans le pipeline (−1 si inconnu). */
export function orderStatusIndex(status: OrderStatus): number {
  return ORDER_STATUSES.indexOf(status);
}

/** État suivant du pipeline, ou null si déjà au dernier (« Livré »). */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const i = orderStatusIndex(status);
  return i >= 0 && i < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[i + 1] : null;
}

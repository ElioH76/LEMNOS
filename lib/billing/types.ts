/**
 * Types du module de facturation. Conçus modulaires pour accueillir plus tard
 * devis, avoirs, paiements partiels, etc. sans refonte :
 * - `documentType` ouvre la porte aux devis/avoirs ;
 * - le client est figé (snapshot) sur la facture, tout en gardant un lien
 *   optionnel `clientId` vers la fiche enregistrée.
 */

/**
 * « facture » aujourd'hui ; « devis » est déjà reconnu par le modèle et le
 * stockage pour préparer la transformation devis → facture en un clic (la
 * facture générée pointera vers le devis via `sourceDocumentId`).
 */
export type DocumentType = "facture" | "devis"; // extensible : | "avoir"

export type InvoiceStatus = "brouillon" | "envoyee" | "payee" | "annulee";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "brouillon",
  "envoyee",
  "payee",
  "annulee",
];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
  annulee: "Annulée",
};

/** Badges — palette de la DA. Vert = payée, l'action « aboutie ». */
export const INVOICE_STATUS_STYLE: Record<InvoiceStatus, string> = {
  brouillon: "bg-paper text-stone",
  envoyee: "bg-[#E4E7E6] text-ink",
  payee: "bg-green-soft text-green",
  annulee: "bg-danger-soft text-danger",
};

export type DiscountType = "amount" | "percent";

export interface ClientInput {
  club: string;
  contact: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

/** Champs CRM additionnels d'une fiche client (au-delà des coordonnées). */
export interface ClientExtras {
  /** Couleurs principales du club (codes hex). */
  colors: string[];
  notes: string;
  /** URL du logo (upload via Blob à venir). */
  logoUrl: string;
}

export interface Client extends ClientInput, ClientExtras {
  id: string;
  createdAt: string;
}

export type ClientProfileInput = ClientInput & ClientExtras;

export interface ProductTemplate {
  id: string;
  label: string;
  unitPriceHt: number;
  vatRate: number;
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  label: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number; // en %
  discountType: DiscountType;
  discountValue: number;
}

/** Données saisies (sans identité ni numéro attribués). */
export interface InvoiceInput {
  documentType: DocumentType;
  client: ClientInput;
  clientId: string | null;
  date: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  /** Libellé de commande, ex. « FC Littoral — Équipement Senior 2026/2027 ». */
  projectRef: string;
  internalRef: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  shipping: number;
  globalDiscountType: DiscountType;
  globalDiscountValue: number;
  deposit: number; // acompte déjà payé
  paymentTerms: string;
  notes: string;
  internalComments: string; // jamais sur le PDF
}

export interface Invoice extends InvoiceInput {
  id: string;
  number: string; // LEM-2026-0001
  /** Renseigné quand la facture est issue d'un devis (conversion en un clic). */
  sourceDocumentId?: string;
  createdAt: string;
  updatedAt: string;
}

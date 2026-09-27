/**
 * Modèle de la gestion commerciale : clients, devis, factures (standard,
 * acompte, solde), avoirs, paiements, historique.
 *
 * Un seul type de document (`CommercialDocument`) couvre devis / facture /
 * avoir : mêmes lignes, mêmes totaux, même PDF — seule la nature change. Les
 * lignes, paiements et l'historique sont embarqués dans le document (stockage
 * jsonb, voir store.ts) : un document est une unité cohérente, jamais éclatée.
 *
 * Règles clés :
 * - un devis reçoit son numéro (DEV-2026-001) dès sa création ;
 * - une facture / un avoir ne reçoit son numéro (FAC-2026-001) qu'à
 *   l'ÉMISSION : les brouillons n'en consomment pas, la séquence reste
 *   continue et sans trou ;
 * - une facture émise est verrouillée : toute correction passe par un avoir
 *   (et, si besoin, une facture rectificative) ;
 * - à l'émission, émetteur, client, banque et mentions sont figés dans le
 *   document (snapshots) : un changement de paramètres ne modifie jamais un
 *   document déjà émis.
 */

// ── Clients ────────────────────────────────────────────────────────────────

export type ClientType = "association" | "entreprise" | "particulier";

export const CLIENT_TYPES: ClientType[] = ["association", "entreprise", "particulier"];

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  association: "Association",
  entreprise: "Entreprise",
  particulier: "Particulier",
};

/** Coordonnées figées sur un document (snapshot du client au moment T). */
export interface ClientInput {
  /** Nom / raison sociale (historiquement « club »). */
  club: string;
  contact: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

export interface ClientSnapshot extends ClientInput {
  type: ClientType;
  contactRole: string;
  siren: string;
  siret: string;
  rna: string;
}

/** Champs CRM additionnels d'une fiche client. */
export interface ClientExtras {
  type: ClientType;
  contactRole: string;
  siren: string;
  siret: string;
  /** Numéro RNA (associations). */
  rna: string;
  /** Couleurs principales du club (codes hex). */
  colors: string[];
  notes: string;
  logoUrl: string;
}

export type ClientProfileInput = ClientInput & ClientExtras;

export interface Client extends ClientProfileInput {
  id: string;
  archived: boolean;
  createdAt: string;
}

export function clientSnapshot(c: ClientProfileInput): ClientSnapshot {
  return {
    club: c.club,
    contact: c.contact,
    address: c.address,
    city: c.city,
    zip: c.zip,
    country: c.country,
    phone: c.phone,
    email: c.email,
    type: c.type,
    contactRole: c.contactRole,
    siren: c.siren,
    siret: c.siret,
    rna: c.rna,
  };
}

export interface ProductTemplate {
  id: string;
  label: string;
  description?: string;
  unitPriceHt: number;
  vatRate: number;
  createdAt: string;
}

// ── Documents ──────────────────────────────────────────────────────────────

export type DocumentType = "devis" | "facture" | "avoir";

/** Nature d'une facture. */
export type InvoiceKind = "standard" | "acompte" | "solde";

export const INVOICE_KIND_LABEL: Record<InvoiceKind, string> = {
  standard: "Facture",
  acompte: "Acompte",
  solde: "Solde",
};

export type DiscountType = "amount" | "percent";
export type DepositType = "none" | "percent" | "amount";

export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse" | "expire" | "annule";

export const QUOTE_STATUSES: QuoteStatus[] = [
  "brouillon",
  "envoye",
  "accepte",
  "refuse",
  "expire",
  "annule",
];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
  annule: "Annulé",
};

/** Statut stocké d'une facture / d'un avoir (cycle de vie du document). */
export type InvoiceLifecycle = "brouillon" | "emise" | "annulee";

/** Statut affiché d'une facture — dérivé des paiements et de l'échéance. */
export type InvoiceStatus =
  | "brouillon"
  | "non_payee"
  | "partielle"
  | "payee"
  | "en_retard"
  | "annulee";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "brouillon",
  "non_payee",
  "partielle",
  "payee",
  "en_retard",
  "annulee",
];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  brouillon: "Brouillon",
  non_payee: "Non payée",
  partielle: "Partiellement payée",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

export type PaymentMethod = "virement" | "cheque" | "especes" | "carte" | "autre";

export const PAYMENT_METHODS: PaymentMethod[] = ["virement", "cheque", "especes", "carte", "autre"];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  virement: "Virement bancaire",
  cheque: "Chèque",
  especes: "Espèces",
  carte: "Carte bancaire",
  autre: "Autre",
};

export interface DocumentLine {
  id: string;
  /** Désignation. */
  label: string;
  /** Description (détail sous la désignation). */
  description: string;
  quantity: number;
  unitPriceHt: number;
  /** Taux de TVA en % — ignoré (forcé à 0) en franchise en base. */
  vatRate: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface Payment {
  id: string;
  date: string; // yyyy-mm-dd
  amount: number;
  method: PaymentMethod;
  reference: string;
  comment: string;
  createdAt: string;
}

/** Déduction portée sur une facture de solde (acompte déjà facturé). */
export interface Deduction {
  /** Facture d'acompte d'origine (null pour une reprise de données). */
  invoiceId: string | null;
  number: string | null;
  date: string;
  amount: number;
  label: string;
}

/**
 * Visuel (design de maillot…) joint à un document, choisi dans la médiathèque.
 * À la « congélation » du document (devis envoyé, facture émise), le fichier
 * est copié dans le stockage du document (`frozen`) : supprimer le média de
 * la médiathèque ne fait alors plus disparaître le visuel du document.
 */
export interface DocumentVisual {
  id: string;
  /** Média d'origine dans la médiathèque. */
  mediaId: string | null;
  url: string;
  title: string;
  contentType: string;
  frozen: boolean;
}

export interface HistoryEvent {
  id: string;
  at: string; // ISO
  label: string;
  detail?: string;
}

/** Acceptation d'un devis — par l'admin ou par le client en ligne. */
export interface QuoteAcceptance {
  at: string; // ISO
  /** Date d'acceptation déclarée (yyyy-mm-dd). */
  date: string;
  name: string;
  role: string;
  email: string;
  /**
   * - `admin` : acceptation enregistrée par LEMNOS (bon pour accord papier, email…) ;
   * - `en_ligne_case` : acceptation en ligne par case à cocher « Bon pour accord » ;
   * - `en_ligne_signature` : acceptation en ligne avec signature manuscrite
   *   dessinée (image). Ce n'est PAS une signature électronique qualifiée au
   *   sens eIDAS : c'est une preuve d'accord renforcée, clairement distinguée.
   */
  method: "admin" | "en_ligne_case" | "en_ligne_signature";
  /** Image PNG (data URL) de la signature dessinée, le cas échéant. */
  signature?: string;
  /** Justificatif / canal pour une acceptation enregistrée par l'admin. */
  note?: string;
  ip?: string;
  userAgent?: string;
}

/** Coordonnées vendeur figées à l'émission. */
export interface SellerSnapshot {
  name: string;
  tradeName: string;
  manager: string;
  legalStatus: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  siret: string;
  siren: string;
  tvaIntra: string;
  email: string;
  phone: string;
  website: string;
  primaryColor: string;
  logoUrl: string;
}

export interface BankSnapshot {
  holder: string;
  bank: string;
  iban: string;
  bic: string;
}

/** Mentions légales et conditions figées à l'émission. */
export interface TermsSnapshot {
  vatExempt: boolean;
  vatMention: string;
  latePenaltyText: string;
  recoveryIndemnityText: string;
  earlyPaymentText: string;
  retentionOfTitleText: string;
  generalConditions: string;
}

export interface DocumentInput {
  clientId: string | null;
  /** Objet du document, ex. « Équipement FC Littoral — 15 kits ». */
  subject: string;
  date: string; // yyyy-mm-dd
  lines: DocumentLine[];
  globalDiscountType: DiscountType;
  globalDiscountValue: number;
  /** Libellé de la remise globale, ex. « Remise partenaire ». */
  globalDiscountLabel: string;
  shipping: number;
  notes: string;
  paymentTerms: string;
  internalComments: string;

  // Devis
  validUntil: string;
  plannedDeliveryDate: string;
  deliveryLeadTime: string;
  depositType: DepositType;
  depositValue: number;

  // Facture
  dueDate: string;
  /** Date de livraison RÉELLE (≠ livraison prévisionnelle du devis). */
  deliveryDate: string;
  paymentMethod: PaymentMethod;
  /** Montant d'une facture d'acompte. */
  depositAmount: number;

  /** Visuels joints (annexe « Visuels du projet » du PDF). */
  visuals: DocumentVisual[];
  /** Afficher l'annexe des visuels sur ce document. */
  showVisuals: boolean;
}

export interface CommercialDocument extends DocumentInput {
  id: string;
  type: DocumentType;
  /** Nature d'une facture (standard / acompte / solde). */
  kind: InvoiceKind;
  /** null tant qu'une facture / un avoir n'est pas émis. */
  number: string | null;
  quoteStatus: QuoteStatus;
  lifecycle: InvoiceLifecycle;

  client: ClientSnapshot;

  /** Devis d'origine (factures d'acompte / de solde, avoirs issus d'un devis). */
  quoteId: string | null;
  /** Facture d'origine d'un avoir. */
  invoiceId: string | null;
  /** Facture corrigée par cette facture rectificative. */
  correctsId: string | null;
  /** Avoir ayant annulé cette facture. */
  creditNoteId: string | null;
  /** Devis remplacé par cette nouvelle version / devis qui remplace celui-ci. */
  revisionOf: string | null;
  replacedBy: string | null;
  /** Motif d'un avoir. */
  reason: string;

  deductions: Deduction[];
  payments: Payment[];

  acceptance: QuoteAcceptance | null;
  /** Jeton du lien public d'acceptation en ligne (devis). */
  publicToken: string | null;
  fulfillment: { productionAt: string | null; deliveredAt: string | null };

  seller: SellerSnapshot | null;
  bank: BankSnapshot | null;
  terms: TermsSnapshot | null;
  /** Franchise en base de TVA : figée sur le document. */
  vatExempt: boolean;

  issuedAt: string | null;
  sentAt: string | null;
  /** PDF archivé (Blob privé) à l'émission. */
  pdfUrl: string | null;
  archived: boolean;
  history: HistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

/** Alias historique : le reste de l'admin parle de « factures ». */
export type Invoice = CommercialDocument;

/** Libellé de la nature d'un document (titre du PDF). */
export function documentTitle(doc: Pick<CommercialDocument, "type" | "kind" | "correctsId">): string {
  if (doc.type === "devis") return "Devis";
  if (doc.type === "avoir") return "Avoir";
  if (doc.kind === "acompte") return "Facture d'acompte";
  if (doc.correctsId) return "Facture rectificative";
  return "Facture";
}

/** Numéro affichable (brouillon non numéroté). */
export function displayNumber(doc: Pick<CommercialDocument, "number">): string {
  return doc.number ?? "Brouillon";
}

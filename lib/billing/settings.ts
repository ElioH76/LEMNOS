import type { BankSnapshot, PaymentMethod, SellerSnapshot, TermsSnapshot } from "./types";

/**
 * Paramètres de la gestion commerciale — modifiables depuis
 * Admin → Paramètres, stockés en base (voir store.ts). Les valeurs ci-dessous
 * ne sont que les valeurs INITIALES, appliquées tant que rien n'a été
 * enregistré (et pour tout champ ajouté plus tard).
 *
 * Aucune donnée bancaire n'est codée ici : l'IBAN / BIC se saisissent
 * uniquement dans l'admin.
 */

export interface CompanySettings extends SellerSnapshot {
  vatExempt: boolean;
  vatMention: string;
  slogan: string;
}

export interface TermsSettings {
  /** Délai de paiement standard en jours (0 = à réception). */
  paymentDelayDays: number;
  /** Acompte proposé par défaut sur un nouveau devis (%). */
  defaultDepositPercent: number;
  defaultPaymentMethod: PaymentMethod;
  /** Durée de validité par défaut d'un devis (jours). */
  quoteValidityDays: number;
  paymentTermsText: string;
  latePenaltyText: string;
  recoveryIndemnityText: string;
  earlyPaymentText: string;
  retentionOfTitleText: string;
  generalConditions: string;
}

export interface NumberingSettings {
  quotePrefix: string;
  invoicePrefix: string;
  creditPrefix: string;
  /** Nombre de chiffres du compteur (001 → 3). */
  padding: number;
}

export interface EmailSettings {
  quoteSubject: string;
  quoteBody: string;
  invoiceSubject: string;
  invoiceBody: string;
  creditSubject: string;
  creditBody: string;
}

export interface CommercialSettings {
  company: CompanySettings;
  bank: BankSnapshot;
  terms: TermsSettings;
  numbering: NumberingSettings;
  email: EmailSettings;
}

const SIGNATURE = "Cordialement,\n\nLEMNOS\nElio HARDOUIN\ncontact@lemnos-sportswear.fr";

export const DEFAULT_SETTINGS: CommercialSettings = {
  company: {
    name: "LEMNOS",
    tradeName: "LEMNOS",
    manager: "Elio HARDOUIN",
    legalStatus: "Entrepreneur individuel (EI)",
    address: "18 rue Champlain",
    zip: "76600",
    city: "Le Havre",
    country: "France",
    siret: "108 058 249 00013",
    siren: "108 058 249",
    tvaIntra: "",
    email: "contact@lemnos-sportswear.fr",
    phone: "06 79 98 72 86",
    website: "lemnos-sportswear.fr",
    primaryColor: "#1E5B3C",
    logoUrl: "",
    slogan: "Forgez vos idées",
    vatExempt: true,
    vatMention: "TVA non applicable – art. 293 B du CGI",
  },
  bank: { holder: "", bank: "", iban: "", bic: "" },
  terms: {
    paymentDelayDays: 0,
    defaultDepositPercent: 50,
    defaultPaymentMethod: "virement",
    quoteValidityDays: 30,
    paymentTermsText: "Paiement comptant à réception de la facture, par virement bancaire.",
    latePenaltyText:
      "En cas de retard de paiement, des pénalités seront exigibles au taux de trois fois le taux d'intérêt légal en vigueur (art. L441-10 du Code de commerce).",
    recoveryIndemnityText:
      "Indemnité forfaitaire pour frais de recouvrement due au créancier en cas de retard de paiement : 40 € (art. D441-5 du Code de commerce).",
    earlyPaymentText: "Pas d'escompte pour paiement anticipé.",
    retentionOfTitleText:
      "Les marchandises restent la propriété de LEMNOS jusqu'au paiement intégral du prix.",
    generalConditions: "",
  },
  numbering: { quotePrefix: "DEV", invoicePrefix: "FAC", creditPrefix: "AV", padding: 3 },
  email: {
    quoteSubject: "Devis {numero} — LEMNOS",
    quoteBody:
      "Bonjour,\n\nVeuillez trouver ci-joint notre devis concernant votre projet d'équipement sportif.\n\n{lien_acceptation}Nous restons disponibles pour toute question.\n\n" +
      SIGNATURE,
    invoiceSubject: "{type} {numero} — LEMNOS",
    invoiceBody:
      "Bonjour,\n\nVeuillez trouver ci-joint notre {type_minuscule} {numero} d'un montant de {montant}.\n\nNous restons disponibles pour toute question.\n\n" +
      SIGNATURE,
    creditSubject: "Avoir {numero} — LEMNOS",
    creditBody:
      "Bonjour,\n\nVeuillez trouver ci-joint notre avoir {numero} d'un montant de {montant}.\n\n" + SIGNATURE,
  },
};

/** Fusion profonde avec les valeurs par défaut (champs manquants → défaut). */
export function withDefaults(partial: Partial<CommercialSettings> | null | undefined): CommercialSettings {
  const p = partial ?? {};
  return {
    company: { ...DEFAULT_SETTINGS.company, ...(p.company ?? {}) },
    bank: { ...DEFAULT_SETTINGS.bank, ...(p.bank ?? {}) },
    terms: { ...DEFAULT_SETTINGS.terms, ...(p.terms ?? {}) },
    numbering: { ...DEFAULT_SETTINGS.numbering, ...(p.numbering ?? {}) },
    email: { ...DEFAULT_SETTINGS.email, ...(p.email ?? {}) },
  };
}

export function sellerSnapshot(c: CompanySettings): SellerSnapshot {
  return {
    name: c.name,
    tradeName: c.tradeName,
    manager: c.manager,
    legalStatus: c.legalStatus,
    address: c.address,
    zip: c.zip,
    city: c.city,
    country: c.country,
    siret: c.siret,
    siren: c.siren,
    tvaIntra: c.tvaIntra,
    email: c.email,
    phone: c.phone,
    website: c.website,
    primaryColor: c.primaryColor,
    logoUrl: c.logoUrl,
  };
}

export function termsSnapshot(s: CommercialSettings): TermsSnapshot {
  return {
    vatExempt: s.company.vatExempt,
    vatMention: s.company.vatMention,
    latePenaltyText: s.terms.latePenaltyText,
    recoveryIndemnityText: s.terms.recoveryIndemnityText,
    earlyPaymentText: s.terms.earlyPaymentText,
    retentionOfTitleText: s.terms.retentionOfTitleText,
    generalConditions: s.terms.generalConditions,
  };
}

/** Numéro formaté : DEV-2026-001. */
export function formatNumber(prefix: string, year: number, seq: number, padding: number): string {
  return `${prefix}-${year}-${String(seq).padStart(Math.max(1, padding), "0")}`;
}

/** Remplace les variables {numero}, {client}… d'un modèle d'email. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? vars[key] : m));
}

/** Valeurs par défaut proposées par les formulaires de devis / facture. */
export function formDefaults(s: CommercialSettings) {
  return {
    vatExempt: s.company.vatExempt,
    vatMention: s.company.vatMention,
    depositPercent: s.terms.defaultDepositPercent,
    quoteValidityDays: s.terms.quoteValidityDays,
    paymentTermsText: s.terms.paymentTermsText,
    paymentDelayDays: s.terms.paymentDelayDays,
    paymentMethod: s.terms.defaultPaymentMethod,
  };
}

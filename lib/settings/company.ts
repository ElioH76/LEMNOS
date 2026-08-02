/**
 * Coordonnées de LEMNOS — « paramètres du site ».
 * Source unique, jamais ressaisie : utilisée par le formulaire de facture (en
 * lecture seule) et par le PDF. À terme, ce module peut passer en base pour
 * devenir éditable depuis une page Paramètres.
 *
 * Les champs vides ci-dessous (siret, tvaIntra, iban, bic) sont à compléter :
 * ils sont automatiquement omis du PDF et de l'affichage tant qu'ils sont vides.
 */
export interface CompanySettings {
  name: string;
  legalForm: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  siren: string;
  siret: string;
  rcs: string;
  tvaIntra: string;
  iban: string;
  bic: string;
  /**
   * Franchise en base de TVA (art. 293 B du CGI) : quand true, aucune TVA
   * n'est facturée et la mention légale correspondante s'affiche
   * automatiquement à la place du numéro de TVA intracommunautaire.
   */
  vatExempt: boolean;
  vatExemptMention: string;
  /** Conditions de paiement par défaut proposées sur une nouvelle facture. */
  defaultPaymentTerms: string;
}

export const company: CompanySettings = {
  name: "LEMNOS",
  legalForm: "",
  address: "18 Rue Champlain",
  zip: "76600",
  city: "Le Havre",
  country: "France",
  email: "contact@lemnos-sportswear.fr",
  phone: "06 79 98 72 86",
  siren: "108 058 249",
  siret: "", // à compléter
  rcs: "Le Havre 108 058 249",
  tvaIntra: "", // à compléter
  iban: "", // à compléter
  bic: "", // à compléter
  vatExempt: false, // passer à true si LEMNOS est en franchise en base de TVA
  vatExemptMention: "TVA non applicable, art. 293 B du CGI",
  defaultPaymentTerms: "Paiement à 30 jours à réception de facture.",
};

/** Adresse compacte sur une ligne, ex. pour un en-tête. */
export function companyAddressLine(c: CompanySettings = company): string {
  return `${c.address}, ${c.zip} ${c.city}, ${c.country}`;
}

/**
 * Mentions légales, adaptées automatiquement au statut fiscal :
 * - régime normal : numéro de TVA intracommunautaire (si renseigné) ;
 * - franchise en base : mention « TVA non applicable, art. 293 B du CGI ».
 */
export function companyLegalMentions(c: CompanySettings = company): string {
  const parts = [`${c.name} — ${companyAddressLine(c)}`];
  if (c.siren) parts.push(`SIREN ${c.siren}`);
  if (c.siret) parts.push(`SIRET ${c.siret}`);
  if (c.rcs) parts.push(`RCS ${c.rcs}`);
  if (c.vatExempt) parts.push(c.vatExemptMention);
  else if (c.tvaIntra) parts.push(`TVA ${c.tvaIntra}`);
  return parts.join(" · ");
}

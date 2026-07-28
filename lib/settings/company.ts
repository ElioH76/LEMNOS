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
  email: "contact@lemnos-sportwear.fr",
  phone: "06 79 98 72 86",
  siren: "108 058 249",
  siret: "", // à compléter
  rcs: "Le Havre 108 058 249",
  tvaIntra: "", // à compléter
  iban: "", // à compléter
  bic: "", // à compléter
  defaultPaymentTerms: "Paiement à 30 jours à réception de facture.",
};

/** Adresse compacte sur une ligne, ex. pour un en-tête. */
export function companyAddressLine(c: CompanySettings = company): string {
  return `${c.address}, ${c.zip} ${c.city}, ${c.country}`;
}

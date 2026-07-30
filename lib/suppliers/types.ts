/**
 * Fournisseurs (module 7) — carnet d'achats/production. Modèle volontairement
 * proche du CRM client : identité + coordonnées, plus une catégorie métier et
 * les produits/prestations fournis (tags libres). Aucune infra nouvelle.
 */

export type SupplierCategory =
  | "textile"
  | "impression"
  | "broderie"
  | "accessoires"
  | "autre";

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  "textile",
  "impression",
  "broderie",
  "accessoires",
  "autre",
];

export const SUPPLIER_CATEGORY_LABEL: Record<SupplierCategory, string> = {
  textile: "Textile",
  impression: "Flocage / Impression",
  broderie: "Broderie",
  accessoires: "Accessoires",
  autre: "Autre",
};

/** Badges — palette de la DA. Le vert marque le textile, matière première. */
export const SUPPLIER_CATEGORY_STYLE: Record<SupplierCategory, string> = {
  textile: "bg-green-soft text-green",
  impression: "bg-[#E4E7E6] text-ink",
  broderie: "bg-status-design-bg text-status-design-fg",
  accessoires: "bg-paper text-stone",
  autre: "bg-paper text-ash",
};

export interface SupplierInput {
  name: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  category: SupplierCategory;
  /** Produits / prestations fournis (tags libres). */
  products: string[];
  notes: string;
}

export interface Supplier extends SupplierInput {
  id: string;
  createdAt: string;
}

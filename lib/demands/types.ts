export type DemandStatus = "nouveau" | "en_cours" | "traite" | "archive";

export const DEMAND_STATUSES: DemandStatus[] = ["nouveau", "en_cours", "traite", "archive"];

export const STATUS_LABEL: Record<DemandStatus, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
  archive: "Archivé",
};

/** Styles de badge — palette de la nouvelle DA. Le vert marque « Nouveau ». */
export const STATUS_STYLE: Record<DemandStatus, string> = {
  nouveau: "bg-green-soft text-green",
  en_cours: "bg-[#E4E7E6] text-ink",
  traite: "bg-paper text-stone",
  archive: "bg-paper text-ash",
};

export interface Demand {
  id: string;
  createdAt: string;
  structure: string;
  type: string;
  sport: string;
  quantity: string;
  email: string;
  phone: string;
  brief: string;
  /** Noms des fichiers déposés (l'upload réel des blobs est à venir). */
  files: string[];
  status: DemandStatus;
  /** Design issu du configurateur 3D (absent pour le formulaire classique). */
  design?: DemandDesign | null;
}

/**
 * Création transmise depuis le configurateur 3D. Les images (aperçus, logos
 * du client) sont des URL Blob privées — ou des data URL si Blob n'est pas
 * configuré.
 */
export interface DemandDesign {
  designId: string;
  contactName: string;
  previews: { front: string; back: string };
  /** Configuration validée (DesignConfig), logos pointant vers leur stockage. */
  config: unknown;
}

/** Données reçues du formulaire public. */
export interface NewDemand {
  structure: string;
  type: string;
  sport: string;
  quantity: string;
  email: string;
  phone: string;
  brief: string;
  files: string[];
  design?: DemandDesign | null;
}

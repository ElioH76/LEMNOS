import type { ProjectStatus } from "./types";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  design: "Design",
  prototype: "Prototype",
  production: "Production",
  livre: "Livré",
};

/**
 * Badges de statut — nouvelle DA. Le vert est réservé au « Prototype » (l'action
 * attendue du client) ; les autres restent en niveaux de gris pour ne pas diluer
 * l'accent.
 */
export const STATUS_STYLE: Record<ProjectStatus, string> = {
  design: "bg-status-design-bg text-status-design-fg",
  prototype: "bg-status-prototype-bg text-status-prototype-fg",
  production: "bg-status-production-bg text-status-production-fg",
  livre: "bg-status-livre-bg text-status-livre-fg",
};

/** Teinte de l'icône produit dans la table, selon l'avancement. */
export const STATUS_ICON_TINT: Record<ProjectStatus, string> = {
  design: "text-slate",
  prototype: "text-green",
  production: "text-slate",
  livre: "text-ash",
};

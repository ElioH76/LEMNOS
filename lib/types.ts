export type ProjectStatus = "design" | "prototype" | "production" | "livre";

export type StepState = "done" | "current" | "todo";

/** Les 5 étapes du parcours Lemnos, dans l'ordre. */
export const STEP_ORDER = [
  "design",
  "validation",
  "prototype",
  "production",
  "livraison",
] as const;

export type StepId = (typeof STEP_ORDER)[number];

export interface TimelineStep {
  id: StepId;
  title: string;
  /** Libellé affiché sous l'étape : « Validé 20 janv. », « En cours », « À venir »… */
  date: string;
  state: StepState;
}

export interface Project {
  id: string;
  name: string;
  /** Référence Lemnos, ex. LM-2026-014 */
  ref: string;
  /** Famille produit affichée dans la colonne Type. */
  type: string;
  status: ProjectStatus;
  /** Échéance formatée pour l'affichage, ex. « 12 mars » ou « Terminé ». */
  due: string;
  timeline: TimelineStep[];
  /** Vrai si le projet est mis en avant dans le ProjectSpotlight. */
  spotlight?: boolean;
  /** Détail affiché sous le titre du spotlight. */
  summary?: string;
  /** Nombre de pièces commandées. */
  quantity?: number;
  /** Visible dans la table « Tous mes projets » (les archives ne le sont pas). */
  listed?: boolean;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  /** Une seule activité est mise en avant en Braise : la plus récente actionnable. */
  highlight?: boolean;
}

export interface Contact {
  name: string;
  role: string;
  initials: string;
  /** Copie du délai de réponse annoncé au client. */
  blurb: string;
}

export interface Account {
  name: string;
  initials: string;
  meta: string;
}

import { STEP_ORDER, type Project, type ProjectStatus, type StepId } from "./types";

export type StatKey = "actifs" | "production" | "a-valider" | "livres";

export interface Stat {
  key: StatKey;
  label: string;
  value: number;
}

/** Statut d'un projet en fonction de l'étape où il se trouve. */
const STATUS_BY_STEP: Record<StepId, ProjectStatus> = {
  design: "design",
  validation: "design",
  prototype: "prototype",
  production: "production",
  livraison: "production",
};

/**
 * Avancement = part des étapes entamées (done + current) sur les 5 du parcours.
 * Le spotlight du design est à l'étape Prototype : 3/5 → 60 %.
 */
export function computeProgress(project: Project): number {
  const started = project.timeline.filter((step) => step.state !== "todo").length;
  return Math.round((started / project.timeline.length) * 100);
}

/**
 * Compteurs dérivés des projets.
 *
 * « Projets actifs » = projets engagés en fabrication (prototype ou production).
 * Un projet encore en phase Design n'est pas compté : c'est la seule lecture qui
 * reproduit le 2 de la maquette, dont les 4 projets comptent 3 non-livrés.
 */
export function deriveStats(projects: Project[]): Stat[] {
  const count = (predicate: (p: Project) => boolean) => projects.filter(predicate).length;

  return [
    {
      key: "actifs",
      label: "Projets actifs",
      value: count((p) => p.status === "prototype" || p.status === "production"),
    },
    { key: "production", label: "En production", value: count((p) => p.status === "production") },
    { key: "a-valider", label: "À valider", value: count((p) => p.status === "prototype") },
    { key: "livres", label: "Livrés", value: count((p) => p.status === "livre") },
  ];
}

/**
 * Fait passer l'étape courante à « done » et démarre la suivante.
 * Le statut du projet suit l'étape atteinte, ce qui repeint le badge de la table
 * et recalcule les compteurs.
 */
export function advanceProject(project: Project, dateLabel: string): Project {
  const currentIndex = project.timeline.findIndex((step) => step.state === "current");
  const isLastStep = currentIndex === project.timeline.length - 1;
  if (currentIndex === -1) return project;

  const timeline = project.timeline.map((step, index) => {
    if (index === currentIndex) {
      const label = isLastStep ? `Livré ${dateLabel}` : `Validé ${dateLabel}`;
      return { ...step, state: "done" as const, date: label };
    }
    if (index === currentIndex + 1) {
      return { ...step, state: "current" as const, date: "En cours" };
    }
    return step;
  });

  const nextStep = STEP_ORDER[Math.min(currentIndex + 1, STEP_ORDER.length - 1)];
  const status: ProjectStatus = isLastStep ? "livre" : STATUS_BY_STEP[nextStep];

  return { ...project, timeline, status };
}

/** Date courte à la française, ex. « 17 juil. ». */
export function shortDate(date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

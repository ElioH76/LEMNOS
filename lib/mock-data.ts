import type {
  Account,
  ActivityItem,
  Contact,
  Project,
  StepId,
  TimelineStep,
} from "./types";

/**
 * Seed de démonstration. Chaque export a la forme que renverra l'API :
 * remplacer ce fichier par des `fetch` dans le RSC suffit à brancher le back.
 */

export type NavIconKey =
  | "overview"
  | "projects"
  | "prototypes"
  | "orders"
  | "messages"
  | "settings";

export interface NavItem {
  key: NavIconKey;
  label: string;
  href: string;
  /** Compteur affiché en pastille Braise ; absent = pas de pastille. */
  badge?: number;
}

export const navItems: NavItem[] = [
  { key: "overview", label: "Vue d'ensemble", href: "/" },
  { key: "projects", label: "Mes projets", href: "/projets", badge: 2 },
  { key: "prototypes", label: "Prototypes", href: "/prototypes", badge: 1 },
  { key: "orders", label: "Commandes", href: "/commandes" },
  { key: "messages", label: "Messages", href: "/messages", badge: 3 },
  { key: "settings", label: "Paramètres", href: "/parametres" },
];

export const account: Account = {
  name: "AS Montcerf",
  initials: "AM",
  meta: "Club · Football",
};

export const contact: Contact = {
  name: "Sarah Lemaire",
  role: "Chef de projet · Lemnos",
  initials: "SL",
  blurb: "Une question sur votre commande ? Je vous réponds en général sous 2 h.",
};

/** Fabrique une timeline complète à partir de l'étape en cours. */
function timelineAt(
  currentStep: StepId,
  dates: Partial<Record<StepId, string>>,
): TimelineStep[] {
  const titles: Record<StepId, string> = {
    design: "Design",
    validation: "Validation",
    prototype: "Prototype",
    production: "Production",
    livraison: "Livraison",
  };
  const order: StepId[] = ["design", "validation", "prototype", "production", "livraison"];
  const currentIndex = order.indexOf(currentStep);

  return order.map((id, index) => {
    const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
    const fallback = state === "done" ? "Validé" : state === "current" ? "En cours" : "À venir";
    return { id, title: titles[id], date: dates[id] ?? fallback, state };
  });
}

export const projects: Project[] = [
  {
    id: "p-014",
    name: "Collection domicile 2026",
    ref: "LM-2026-014",
    type: "Maillots",
    status: "prototype",
    due: "12 mars",
    spotlight: true,
    listed: true,
    quantity: 32,
    summary: "32 maillots · réf. LM-2026-014 · livraison estimée 12 mars",
    timeline: timelineAt("prototype", {
      design: "Validé 20 janv.",
      validation: "Validé 28 janv.",
      livraison: "~ 12 mars",
    }),
  },
  {
    id: "p-021",
    name: "Survêtements staff",
    ref: "LM-2026-021",
    type: "Survêt.",
    status: "production",
    due: "20 mars",
    listed: true,
    quantity: 14,
    timeline: timelineAt("production", {
      design: "Validé 12 janv.",
      validation: "Validé 24 janv.",
      prototype: "Validé 3 févr.",
      livraison: "~ 20 mars",
    }),
  },
  {
    id: "p-009",
    name: "Hoodies supporters",
    ref: "LM-2026-009",
    type: "Lifestyle",
    status: "design",
    due: "2 avr.",
    listed: true,
    quantity: 60,
    timeline: timelineAt("design", { livraison: "~ 2 avr." }),
  },
  {
    id: "p-088",
    name: "Maillots extérieur 2025",
    ref: "LM-2025-088",
    type: "Maillots",
    status: "livre",
    due: "Terminé",
    listed: true,
    quantity: 30,
    timeline: timelineAt("livraison", {
      design: "Validé 4 mars",
      validation: "Validé 15 mars",
      prototype: "Validé 2 avr.",
      production: "Validé 28 avr.",
      livraison: "Livré 16 mai",
    }),
  },
  // Livrés archivés : comptés dans les stats, hors de la table « Tous mes projets ».
  {
    id: "p-061",
    name: "Polos entraînement 2025",
    ref: "LM-2025-061",
    type: "Lifestyle",
    status: "livre",
    due: "Terminé",
    listed: false,
    quantity: 24,
    timeline: timelineAt("livraison", { livraison: "Livré 9 sept." }),
  },
  {
    id: "p-042",
    name: "Chaussettes match 2025",
    ref: "LM-2025-042",
    type: "Accessoires",
    status: "livre",
    due: "Terminé",
    listed: false,
    quantity: 80,
    timeline: timelineAt("livraison", { livraison: "Livré 21 juin" }),
  },
];

export const activity: ActivityItem[] = [
  {
    id: "a-1",
    text: "Votre prototype « Collection domicile 2026 » est prêt à être validé.",
    time: "Aujourd'hui · 09:12",
    highlight: true,
  },
  {
    id: "a-2",
    text: "Sarah a mis à jour le design des manches suite à vos retours.",
    time: "Hier · 16:40",
  },
  {
    id: "a-3",
    text: "Devis validé pour « Survêtements staff ».",
    time: "3 févr. · 11:05",
  },
  {
    id: "a-4",
    text: "Nouveau projet « Hoodies supporters » créé.",
    time: "1 févr. · 14:22",
  },
];

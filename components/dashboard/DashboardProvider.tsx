"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { advanceProject, deriveStats, shortDate, type Stat } from "@/lib/stats";
import type { ActivityItem, Project } from "@/lib/types";

interface DashboardValue {
  projects: Project[];
  /** Projets affichés dans « Tous mes projets » (les archives sont exclues). */
  listedProjects: Project[];
  spotlightProject: Project | undefined;
  stats: Stat[];
  activity: ActivityItem[];
  messaging: { open: boolean; subject: string };
  validatePrototype: (projectId: string) => void;
  openMessaging: (subject?: string) => void;
  closeMessaging: () => void;
}

const DashboardContext = createContext<DashboardValue | null>(null);

export function useDashboard(): DashboardValue {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboard doit être utilisé dans un <DashboardProvider>.");
  return value;
}

export function DashboardProvider({
  initialProjects,
  initialActivity,
  children,
}: {
  initialProjects: Project[];
  initialActivity: ActivityItem[];
  children: ReactNode;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [activity, setActivity] = useState(initialActivity);
  const [messaging, setMessaging] = useState({ open: false, subject: "" });

  const openMessaging = useCallback((subject = "") => setMessaging({ open: true, subject }), []);
  const closeMessaging = useCallback(() => setMessaging((m) => ({ ...m, open: false })), []);

  /**
   * Une validation avance la timeline du projet et change son statut : les
   * compteurs et le badge suivent, puisqu'ils sont dérivés de `projects`.
   */
  const validatePrototype = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const advanced = advanceProject(project, shortDate());
      if (advanced === project) return;

      setProjects((current) => current.map((p) => (p.id === projectId ? advanced : p)));

      const time = new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());

      setActivity((items) => [
        {
          id: `a-${projectId}-${items.length}`,
          text: `Vous avez validé le prototype « ${project.name} ». La production est lancée.`,
          time: `Aujourd'hui · ${time}`,
          highlight: true,
        },
        ...items.map((item) => ({ ...item, highlight: false })),
      ]);
    },
    [projects],
  );

  const value = useMemo<DashboardValue>(
    () => ({
      projects,
      listedProjects: projects.filter((p) => p.listed),
      spotlightProject: projects.find((p) => p.spotlight),
      stats: deriveStats(projects),
      activity,
      messaging,
      validatePrototype,
      openMessaging,
      closeMessaging,
    }),
    [projects, activity, messaging, validatePrototype, openMessaging, closeMessaging],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

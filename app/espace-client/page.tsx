import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ContactCard } from "@/components/dashboard/ContactCard";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { MessageDrawer } from "@/components/dashboard/MessageDrawer";
import { ProjectSpotlight } from "@/components/dashboard/ProjectSpotlight";
import { ProjectsTable } from "@/components/dashboard/ProjectsTable";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { account, activity, contact, navItems, projects } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Lemnos — Espace client",
  description: "Suivez vos projets de vêtements et équipements personnalisés Lemnos.",
};

/**
 * Server Component : il lit les données et les passe au provider.
 * Brancher l'API = remplacer ces imports par des `await fetch(...)`.
 */
export default function DashboardPage() {
  return (
    <DashboardProvider initialProjects={projects} initialActivity={activity}>
      <AppShell account={account} nav={navItems} activeKey="overview">
        <StatsGrid />

        <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_theme(spacing.aside)]">
          <div className="flex min-w-0 flex-col gap-6">
            <ProjectSpotlight />
            <ProjectsTable />
          </div>
          <div className="flex flex-col gap-6">
            <ContactCard contact={contact} />
            <ActivityFeed />
          </div>
        </div>
      </AppShell>

      <MessageDrawer contact={contact} />
    </DashboardProvider>
  );
}

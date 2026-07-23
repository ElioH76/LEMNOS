"use client";

import { Check, Factory, Folder, Shirt, type LucideIcon } from "lucide-react";
import { StatCard } from "./StatCard";
import { useDashboard } from "./DashboardProvider";
import type { StatKey } from "@/lib/stats";

const STAT_ICONS: Record<StatKey, LucideIcon> = {
  actifs: Folder,
  production: Factory,
  "a-valider": Shirt,
  livres: Check,
};

export function StatsGrid() {
  const { stats } = useDashboard();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          label={stat.label}
          value={stat.value}
          icon={STAT_ICONS[stat.key]}
        />
      ))}
    </div>
  );
}

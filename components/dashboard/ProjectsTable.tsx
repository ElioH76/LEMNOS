"use client";

import { Shirt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { STATUS_ICON_TINT } from "@/lib/theme";
import { StatusBadge } from "./StatusBadge";
import { useDashboard } from "./DashboardProvider";

const COLS = "grid-cols-[2fr_1.2fr_1.3fr_1fr]";

export function ProjectsTable() {
  const { listedProjects } = useDashboard();

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line-soft px-7 py-5">
        <h2 className="text-[17px] font-bold tracking-tight">Tous mes projets</h2>
        <a
          href="/projets"
          className="flex-none text-[12px] font-semibold uppercase tracking-caps text-ash transition-colors hover:text-green"
        >
          Voir tout →
        </a>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div
            className={cn(
              "grid gap-4 border-b border-line-soft px-7 py-3.5 text-[11px] font-semibold uppercase tracking-caps text-ash",
              COLS,
            )}
          >
            <span>Projet</span>
            <span>Type</span>
            <span>Statut</span>
            <span className="text-right">Échéance</span>
          </div>

          {listedProjects.map((project) => (
            <div
              key={project.id}
              className={cn("grid items-center gap-4 border-b border-line-soft px-7 py-4 last:border-0", COLS)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-md bg-paper">
                  <Shirt
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden
                    className={STATUS_ICON_TINT[project.status]}
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-semibold">{project.name}</div>
                  <div className="text-[11px] text-ash">{project.ref}</div>
                </div>
              </div>

              <span className="text-[14px] text-slate">{project.type}</span>
              <span>
                <StatusBadge status={project.status} />
              </span>
              <span className="text-right text-[14px] text-slate">{project.due}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

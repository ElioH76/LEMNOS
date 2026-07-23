"use client";

import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { computeProgress } from "@/lib/stats";
import { protoImage } from "@/lib/site-content";
import { STATUS_STYLE } from "@/lib/theme";
import type { ProjectStatus } from "@/lib/types";
import { Timeline } from "./Timeline";
import { useDashboard } from "./DashboardProvider";

/** Le badge du spotlight est plus explicite que celui de la table. */
const SPOTLIGHT_LABEL: Record<ProjectStatus, string> = {
  design: "Design en cours",
  prototype: "Prototype à valider",
  production: "En production",
  livre: "Livré",
};

export function ProjectSpotlight() {
  const { spotlightProject: project, validatePrototype, openMessaging } = useDashboard();

  if (!project) return null;

  const progress = computeProgress(project);
  const awaitingValidation = project.status === "prototype";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-start justify-between gap-5 border-b border-line-soft px-7 pb-5 pt-6 sm:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[21px] font-extrabold tracking-tight">{project.name}</h2>
            <span
              className={cn(
                "rounded-pill px-2.5 py-1 text-[11px] font-semibold tracking-link",
                STATUS_STYLE[project.status],
              )}
            >
              {SPOTLIGHT_LABEL[project.status]}
            </span>
          </div>
          {project.summary && (
            <div className="mt-2 text-[12px] text-stone">{project.summary}</div>
          )}
        </div>

        <div className="flex-none text-left sm:text-right">
          <div className="text-[22px] font-extrabold text-green tabular-nums">{progress}%</div>
          <div className="text-[11px] uppercase tracking-caps text-ash">avancement</div>
        </div>
      </div>

      <Timeline steps={project.timeline} />

      <div className="grid grid-cols-1 items-center gap-6 border-t border-line-soft px-7 py-7 md:grid-cols-[180px_1fr]">
        <div className="relative h-[150px] overflow-hidden rounded-lg border border-line bg-ink-deep">
          <Image
            src={protoImage}
            alt={`Prototype — ${project.name}`}
            fill
            sizes="180px"
            className="object-cover"
          />
        </div>

        {awaitingValidation ? (
          <div>
            <h3 className="mb-2 text-[18px] font-bold tracking-tight">Votre prototype est arrivé</h3>
            <p className="mb-5 max-w-[52ch] text-[14.5px] leading-[1.55] text-slate">
              L&apos;échantillon réel du maillot domicile est prêt. Validez-le pour lancer la
              production des {project.quantity} pièces, ou demandez un ajustement à votre contact.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => validatePrototype(project.id)}>Valider le prototype</Button>
              <Button
                variant="outline"
                onClick={() => openMessaging(`Ajustement — ${project.name} (${project.ref})`)}
              >
                Demander un ajustement
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-2 text-[18px] font-bold tracking-tight">Production lancée</h3>
            <p className="mb-5 max-w-[52ch] text-[14.5px] leading-[1.55] text-slate">
              Vos {project.quantity} pièces sont en fabrication. Nous vous prévenons dès
              l&apos;expédition, prévue pour le {project.due}.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => openMessaging(`Suivi — ${project.name} (${project.ref})`)}
              >
                Contacter mon chef de projet
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

import { getModel } from "./models";
import { COLOR_ZONES, NECK_STYLES, PATTERNS, TEXT_FONTS } from "./options";
import type { DesignConfig } from "./types";

/** Résumé texte d'un design — repris dans la demande de devis et l'email. */
export function designSummaryLines(design: DesignConfig): string[] {
  const model = getModel(design.modelId);
  const zoneLabel = (id: string) => model?.customZones.find((z) => z.id === id)?.label ?? id;
  const lines = [
    `Projet : ${design.designId}`,
    `Modèle : ${model?.name ?? design.modelId} (v${design.modelVersion})`,
    `Couleurs : ${COLOR_ZONES.map((z) => `${z.label} ${design.colors[z.id]}`).join(" · ")}`,
    `Motif : ${PATTERNS.find((p) => p.id === design.pattern.id)?.label ?? design.pattern.id}` +
      (design.pattern.id !== "plain" ? ` (échelle ${design.pattern.scale.toFixed(2)})` : ""),
    `Finitions : ${NECK_STYLES.find((n) => n.id === design.finish.neck)?.label}` +
      `${design.finish.sidePanels ? " · panneaux latéraux" : ""}` +
      `${design.finish.cuffTrim ? " · liserés de manche" : ""}` +
      `${design.finish.hemTrim ? " · bande basse" : ""}` +
      `${design.finish.patternOnSleeves ? " · motif sur manches" : ""}`,
    `Logos Lemnos (3 emplacements fixes) : ${design.lemnosLogoColor}`,
  ];
  if (design.customLogos.length) {
    lines.push(
      `Logos client : ${design.customLogos.map((l) => `${l.kind === "club" ? "club" : "sponsor"} « ${l.name} » → ${zoneLabel(l.zone)}`).join(" ; ")}`,
    );
  }
  const t = design.playerText;
  lines.push(
    t.enabled
      ? `Flocage : ${t.name || "(sans nom)"} n°${t.number || "—"} · police ${TEXT_FONTS.find((f) => f.id === t.font)?.label} · ${t.color}${t.outline ? ` contour ${t.outlineColor}` : ""}`
      : "Flocage : aucun",
  );
  return lines;
}

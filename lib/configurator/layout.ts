import { lemnosAspect } from "./brand";
import type { CustomZone, LockedPlacement, ProductModel, Rect } from "./models/types";
import type { CustomLogo } from "./types";

/**
 * Calculs de mise en page purs (client + serveur) : où tombe chaque élément
 * dans le plan de sa face. Le moteur 3D projette ensuite ces rectangles sur
 * le maillage.
 */

/** Rectangle d'un logo Lemnos : taille et proportions officielles, figées. */
export function lockedRect(p: LockedPlacement): Rect {
  const h = p.height;
  const w = h * lemnosAspect(p.asset);
  return { cx: p.cx, cy: p.cy, hw: w / 2, hh: h / 2 };
}

export const LOGO_SCALE_MIN = 0.4;
export const LOGO_SCALE_MAX = 1;

/**
 * Rectangle d'un logo client : la taille respecte le ratio de l'image et la
 * taille maximale de la zone ; le décalage est borné pour que le logo reste
 * TOUJOURS entièrement dans la région autorisée.
 */
export function customLogoRect(zone: CustomZone, logo: Pick<CustomLogo, "aspect" | "scale" | "offsetX" | "offsetY">): Rect {
  const scale = Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, logo.scale));
  const aspect = Math.max(0.05, Math.min(20, logo.aspect));
  let w = zone.maxW * scale;
  let h = w / aspect;
  if (h > zone.maxH * scale) {
    h = zone.maxH * scale;
    w = h * aspect;
  }
  const freeX = Math.max(0, zone.region.hw - w / 2);
  const freeY = Math.max(0, zone.region.hh - h / 2);
  const ox = Math.min(1, Math.max(-1, logo.offsetX));
  const oy = Math.min(1, Math.max(-1, logo.offsetY));
  return { cx: zone.region.cx + ox * freeX, cy: zone.region.cy + oy * freeY, hw: w / 2, hh: h / 2 };
}

function intersects(a: Rect, b: Rect): boolean {
  return Math.abs(a.cx - b.cx) < a.hw + b.hw && Math.abs(a.cy - b.cy) < a.hh + b.hh;
}

/**
 * Contrôle d'intégrité d'un modèle : aucune région client ni zone de
 * flocage ne doit chevaucher un logo Lemnos verrouillé. Renvoie la liste des
 * conflits (vide = modèle sain).
 */
export function modelConflicts(model: ProductModel): string[] {
  const conflicts: string[] = [];
  const reserved: { id: string; face: string; surface: string; rect: Rect }[] = [];
  for (const zone of model.customZones) {
    reserved.push({ id: zone.id, face: zone.face, surface: zone.surface, rect: zone.region });
    if (zone.maxW > zone.region.hw * 2 + 1e-9 || zone.maxH > zone.region.hh * 2 + 1e-9) {
      conflicts.push(`${zone.id} : taille maximale supérieure à la région`);
    }
  }
  if (model.text) {
    for (const [id, t] of Object.entries(model.text)) {
      reserved.push({ id, face: t.face, surface: "torso", rect: { cx: t.cx, cy: t.cy, hw: t.maxW / 2, hh: t.height / 2 } });
    }
  }
  for (const p of model.lemnosPlacements) {
    const rect = lockedRect(p);
    for (const r of reserved) {
      if (r.face === p.face && r.surface === p.surface && intersects(rect, r.rect)) {
        conflicts.push(`${r.id} chevauche ${p.id}`);
      }
    }
  }
  return conflicts;
}

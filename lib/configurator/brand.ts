/**
 * Ressource officielle du logo Lemnos utilisée par le configurateur.
 *
 * Source unique : `public/images/logo/LEMNOS.svg` (export Illustrator fourni).
 * Le fichier contient un aplat blanc (classe `.st0`) qui sert de fond et de
 * contre-forme : il est retiré au chargement pour obtenir un logo détouré.
 * Les deux cadrages ci-dessous (en unités du viewBox d'origine) isolent :
 * - `mark`   : le symbole seul (même cadrage que components/brand/Mark.tsx) ;
 * - `lockup` : le symbole + le mot LEMNOS, tel que dessiné dans le fichier.
 */
export const LEMNOS_LOGO_URL = "/images/logo/LEMNOS.svg";

export const LEMNOS_LOGO_CROPS = {
  mark: { x: 132, y: 30, w: 326, h: 302 },
  lockup: { x: 76, y: 24, w: 440, h: 378 },
} as const;

export type LemnosAsset = keyof typeof LEMNOS_LOGO_CROPS;

/** Ratio largeur / hauteur officiel de chaque cadrage. */
export function lemnosAspect(asset: LemnosAsset): number {
  const crop = LEMNOS_LOGO_CROPS[asset];
  return crop.w / crop.h;
}

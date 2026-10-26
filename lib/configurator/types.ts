/**
 * Types du configurateur 3D — partagés client ET serveur (aucune dépendance
 * à three.js ici : la validation côté serveur les réutilise).
 *
 * Règle structurante : les trois logos Lemnos ne font PAS partie de la
 * configuration du client. Seule leur couleur y figure (`lemnosLogoColor`).
 * Leurs positions, tailles et proportions vivent exclusivement dans la
 * définition technique du modèle (`lib/configurator/models/*`) et sont
 * reconstruites à chaque rendu — un design importé ne peut donc ni les
 * déplacer, ni les masquer.
 */

/** Couleur hexadécimale normalisée, ex. « #1E5B3C ». */
export type Hex = `#${string}`;

/** Version du schéma de configuration (incrémentée à chaque rupture). */
export const DESIGN_SCHEMA_VERSION = 1 as const;

/** Zones de couleur indépendantes d'un maillot. */
export type ColorZone = "body" | "secondary" | "sleeves" | "collar" | "trim" | "sidePanels";

export type PatternId =
  | "plain"
  | "stripes-vertical"
  | "stripes-horizontal"
  | "diagonal"
  | "gradient"
  | "chevrons"
  | "waves"
  | "tonal"
  | "hex-tech";

export type NeckStyle = "round" | "v";

export type TextFontId = "montserrat" | "oswald" | "bebas" | "teko" | "anton";

/** Emplacements des logos personnalisables (club, sponsors). */
export type CustomZoneId = "crest" | "front-sponsor" | "back-sponsor" | "sleeve-left" | "sleeve-right";

/** Emplacements Lemnos verrouillés — identifiants stables. */
export type LemnosPlacementId = "lemnos_front_chest" | "lemnos_back_neck" | "lemnos_back_hem";

export interface PatternSettings {
  id: PatternId;
  /** Échelle du motif, 0.5 → 2 (1 = taille de référence). */
  scale: number;
}

export interface FinishSettings {
  neck: NeckStyle;
  /** Bandes latérales de couleur sur les flancs. */
  sidePanels: boolean;
  /** Liseré en bout de manche. */
  cuffTrim: boolean;
  /** Bande en bas du maillot. */
  hemTrim: boolean;
  /** Le motif du corps se prolonge sur les manches. */
  patternOnSleeves: boolean;
}

export interface CustomLogo {
  id: string;
  zone: CustomZoneId;
  kind: "club" | "sponsor";
  /** Nom du fichier d'origine (affichage uniquement). */
  name: string;
  /** Image ré-encodée côté navigateur : data:image/png;base64,… */
  src: string;
  /** Ratio largeur / hauteur de l'image (après rognage des marges). */
  aspect: number;
  /** Échelle dans la zone, 0.4 → 1 (1 = taille maximale autorisée). */
  scale: number;
  /** Décalage dans la zone, -1 → 1 (borné pour rester dans la zone). */
  offsetX: number;
  offsetY: number;
}

export interface PlayerText {
  enabled: boolean;
  name: string;
  number: string;
  font: TextFontId;
  color: Hex;
  outline: boolean;
  outlineColor: Hex;
}

export interface DesignConfig {
  schemaVersion: typeof DESIGN_SCHEMA_VERSION;
  /** Identifiant de projet lisible, ex. « LMN-7K3QX9 ». */
  designId: string;
  modelId: string;
  modelVersion: string;
  colors: Record<ColorZone, Hex>;
  pattern: PatternSettings;
  finish: FinishSettings;
  /** Couleur unique, partagée par les trois logos Lemnos. */
  lemnosLogoColor: Hex;
  customLogos: CustomLogo[];
  playerText: PlayerText;
  updatedAt: string;
}

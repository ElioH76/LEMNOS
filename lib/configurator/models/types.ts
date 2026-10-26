import type { ColorZone, CustomZoneId, LemnosPlacementId, PatternId } from "../types";

/**
 * Définition technique d'un produit configurable. Données pures (aucune
 * dépendance three.js) : le serveur s'en sert pour valider les designs, le
 * moteur 3D pour construire la scène.
 *
 * Unités : mètres, repère du modèle (y vers le haut, z vers l'avant du
 * vêtement, x vers la gauche… du spectateur qui regarde la face avant).
 */

/** Maillage du modèle sur lequel une décalcomanie est projetée. */
export type SurfaceKey = "torso" | "sleeveLeft" | "sleeveRight";

/**
 * Face de projection :
 * - front / back : projection orthogonale le long de z, coordonnées (x, y)
 *   dans le plan vu de face (front) ou vu de dos (back, x vers la droite du
 *   spectateur placé derrière) ;
 * - sleeve : face extérieure d'une manche, coordonnées (t, 0) avec t la
 *   position le long de la manche (0 = épaule, 1 = bout de manche).
 */
export type Face = "front" | "back" | "sleeve";

export interface Rect {
  /** Centre dans le plan de la face. */
  cx: number;
  cy: number;
  /** Demi-largeur / demi-hauteur. */
  hw: number;
  hh: number;
}

/** Emplacement Lemnos VERROUILLÉ : position, taille et ressource figées. */
export interface LockedPlacement {
  id: LemnosPlacementId;
  label: string;
  surface: SurfaceKey;
  face: Face;
  cx: number;
  cy: number;
  /** Hauteur imprimée ; la largeur découle du ratio officiel du logo. */
  height: number;
  /** « mark » = symbole seul ; « lockup » = symbole + texte LEMNOS. */
  asset: "mark" | "lockup";
}

/** Zone où le client peut placer SON logo (club, sponsor). */
export interface CustomZone {
  id: CustomZoneId;
  label: string;
  defaultKind: "club" | "sponsor";
  surface: SurfaceKey;
  face: Face;
  /** Région autorisée : le logo ne peut jamais en sortir. */
  region: Rect;
  /** Taille maximale du logo (≤ région). */
  maxW: number;
  maxH: number;
  /** Position par défaut dans la région (-1 → 1). */
  defaultOffset: readonly [number, number];
}

/** Emplacement fixe du flocage nom / numéro. */
export interface TextPlacement {
  face: Face;
  cx: number;
  cy: number;
  height: number;
  maxW: number;
}

/** Paramètres du maillot procédural (modèle de démonstration). */
export interface ProceduralJerseyParams {
  hemY: number;
  armpitY: number;
  topY: number;
  /** Demi-largeur du corps : bas, taille, poitrine. */
  widthHem: number;
  widthWaist: number;
  widthChest: number;
  /** Demi-profondeur du corps : bas, poitrine. */
  depthHem: number;
  depthChest: number;
  /** Demi-largeur des épaules (raccord de manche). */
  shoulderHalfWidth: number;
  shoulderSlope: number;
  neckHalfWidth: number;
  neckDepthFront: number;
  neckDepthBack: number;
  neckDropFront: Record<"round" | "v", number>;
  neckDropBack: number;
  sleeve: {
    /** Origine de l'axe de manche (côté +x ; l'autre manche est symétrique). */
    rootX: number;
    rootY: number;
    /** Inclinaison sous l'horizontale, en degrés. */
    angleDeg: number;
    length: number;
    radiusRoot: number;
    radiusCuff: number;
    /** Aplatissement avant/arrière de la section. */
    flatten: number;
  };
}

export type ModelGeometry =
  | { kind: "procedural-jersey"; params: ProceduralJerseyParams }
  /**
   * Architecture prévue pour un vrai maillot de production : un GLB dont les
   * maillages portent les noms `torso`, `sleeveLeft`, `sleeveRight`, `collar`,
   * avec des UV dépliés selon la convention de `lib/configurator/README.md`.
   * Non branché tant qu'aucun fichier n'est fourni.
   */
  | { kind: "gltf"; url: string };

export interface ProductModel {
  id: string;
  version: string;
  name: string;
  category: "maillot" | "short" | "chaussettes" | "survetement" | "coupe-vent";
  /** true = modèle procédural de démonstration (pas un patron textile réel). */
  demo: boolean;
  geometry: ModelGeometry;
  colorZones: ColorZone[];
  patterns: PatternId[];
  lemnosPlacements: readonly LockedPlacement[];
  customZones: readonly CustomZone[];
  text: { name: TextPlacement; number: TextPlacement } | null;
  /** Point visé par la caméra et distance par défaut. */
  camera: { target: [number, number, number]; distance: number };
}

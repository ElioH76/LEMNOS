import type { ProductModel } from "./types";

/**
 * Maillot de football manches courtes — modèle de DÉMONSTRATION.
 *
 * Le volume est généré procéduralement (surfaces paramétriques : corps,
 * manches, col). Il est proportionné comme un maillot porté « ghost
 * mannequin », mais ce n'est pas un patron textile de production : il sera
 * remplacé par un GLB réel (voir `ModelGeometry`) sans toucher au reste.
 *
 * Positions calées sur l'image de référence FC Littoral : symbole Lemnos en
 * haut de poitrine à gauche vu de face (blason du club en face), symbole
 * réduit sous le col au dos, logo complet au-dessus de l'ourlet au dos.
 * La définition est gelée en profondeur à l'enregistrement (models/index.ts).
 */
export const jerseyShortSleeve: ProductModel = {
  id: "jersey-ss",
  version: "1.0.0-demo",
  name: "Maillot manches courtes",
  category: "maillot",
  demo: true,
  geometry: {
    kind: "procedural-jersey",
    params: {
      hemY: -0.4,
      armpitY: 0.12,
      topY: 0.335,
      widthHem: 0.25,
      widthWaist: 0.238,
      widthChest: 0.262,
      depthHem: 0.155,
      depthChest: 0.175,
      shoulderHalfWidth: 0.215,
      shoulderSlope: 0.36,
      neckHalfWidth: 0.085,
      neckDepthFront: 0.075,
      neckDepthBack: 0.06,
      neckDropFront: { round: 0.07, v: 0.135 },
      neckDropBack: 0.018,
      sleeve: {
        rootX: 0.155,
        rootY: 0.185,
        angleDeg: 50,
        length: 0.29,
        radiusRoot: 0.118,
        radiusCuff: 0.087,
        flatten: 0.86,
      },
    },
  },
  colorZones: ["body", "secondary", "sleeves", "collar", "trim", "sidePanels"],
  patterns: [
    "plain",
    "stripes-vertical",
    "stripes-horizontal",
    "diagonal",
    "gradient",
    "chevrons",
    "waves",
    "tonal",
    "hex-tech",
  ],
  // ── Logos Lemnos : OBLIGATOIRES et VERROUILLÉS ──────────────────────────
  // Seule la couleur est personnalisable (DesignConfig.lemnosLogoColor).
  lemnosPlacements: [
    {
      id: "lemnos_front_chest",
      label: "Poitrine",
      surface: "torso",
      face: "front",
      cx: -0.105,
      cy: 0.078,
      height: 0.062,
      asset: "mark",
    },
    {
      id: "lemnos_back_neck",
      label: "Haut du dos",
      surface: "torso",
      face: "back",
      cx: 0,
      cy: 0.27,
      height: 0.034,
      asset: "mark",
    },
    {
      id: "lemnos_back_hem",
      label: "Bas du dos",
      surface: "torso",
      face: "back",
      cx: 0,
      cy: -0.312,
      height: 0.078,
      asset: "lockup",
    },
  ],
  customZones: [
    {
      id: "crest",
      label: "Blason (poitrine)",
      defaultKind: "club",
      surface: "torso",
      face: "front",
      region: { cx: 0.105, cy: 0.075, hw: 0.055, hh: 0.055 },
      maxW: 0.085,
      maxH: 0.085,
      defaultOffset: [0, 0],
    },
    {
      id: "front-sponsor",
      label: "Sponsor principal (ventre)",
      defaultKind: "sponsor",
      surface: "torso",
      face: "front",
      region: { cx: 0, cy: -0.07, hw: 0.155, hh: 0.075 },
      maxW: 0.25,
      maxH: 0.1,
      defaultOffset: [0, 0.4],
    },
    {
      id: "back-sponsor",
      label: "Sponsor dos",
      defaultKind: "sponsor",
      surface: "torso",
      face: "back",
      region: { cx: 0, cy: -0.148, hw: 0.13, hh: 0.042 },
      maxW: 0.22,
      maxH: 0.07,
      defaultOffset: [0, 0],
    },
    {
      id: "sleeve-left",
      label: "Manche côté logo Lemnos",
      defaultKind: "sponsor",
      surface: "sleeveLeft",
      face: "sleeve",
      region: { cx: 0.5, cy: 0, hw: 0.04, hh: 0.04 },
      maxW: 0.075,
      maxH: 0.075,
      defaultOffset: [0, 0],
    },
    {
      id: "sleeve-right",
      label: "Manche côté blason",
      defaultKind: "sponsor",
      surface: "sleeveRight",
      face: "sleeve",
      region: { cx: 0.5, cy: 0, hw: 0.04, hh: 0.04 },
      maxW: 0.075,
      maxH: 0.075,
      defaultOffset: [0, 0],
    },
  ],
  text: {
    name: { face: "back", cx: 0, cy: 0.205, height: 0.04, maxW: 0.3 },
    number: { face: "back", cx: 0, cy: 0.032, height: 0.2, maxW: 0.28 },
  },
  camera: { target: [0, -0.02, 0], distance: 1.95 },
};

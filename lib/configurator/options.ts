import type { ColorZone, Hex, NeckStyle, PatternId, TextFontId } from "./types";

/**
 * Catalogue des options présentées au client (libellés + valeurs). Toute
 * option listée ici est réellement appliquée au modèle 3D — aucune option
 * « décorative ».
 */

/** Palette prédéfinie — couleurs de club courantes + teintes Lemnos. */
export const PALETTE: { hex: Hex; name: string }[] = [
  { hex: "#1E5B3C", name: "Vert Lemnos" },
  { hex: "#17472F", name: "Vert bouteille" },
  { hex: "#2E8B57", name: "Vert prairie" },
  { hex: "#7FB79A", name: "Vert d'eau" },
  { hex: "#F4C20D", name: "Jaune or" },
  { hex: "#FFE14D", name: "Jaune citron" },
  { hex: "#F28C28", name: "Orange" },
  { hex: "#C52A22", name: "Rouge" },
  { hex: "#8E1B2F", name: "Bordeaux" },
  { hex: "#E2479B", name: "Rose" },
  { hex: "#6A3FA0", name: "Violet" },
  { hex: "#0B2A5B", name: "Marine" },
  { hex: "#1F5FBF", name: "Bleu roi" },
  { hex: "#5DADE2", name: "Ciel" },
  { hex: "#1A1D1F", name: "Anthracite" },
  { hex: "#000000", name: "Noir" },
  { hex: "#6B726D", name: "Gris" },
  { hex: "#C7CCC9", name: "Argent" },
  { hex: "#F4F4F2", name: "Écru" },
  { hex: "#FFFFFF", name: "Blanc" },
];

export const COLOR_ZONES: { id: ColorZone; label: string; hint: string }[] = [
  { id: "body", label: "Couleur principale", hint: "Corps du maillot" },
  { id: "secondary", label: "Couleur secondaire", hint: "Couleur du motif" },
  { id: "sleeves", label: "Manches", hint: "Les deux manches" },
  { id: "collar", label: "Col", hint: "Bord-côte du col" },
  { id: "trim", label: "Finitions", hint: "Liserés de manche et bas du maillot" },
  { id: "sidePanels", label: "Panneaux latéraux", hint: "Bandes sur les flancs" },
];

export const PATTERNS: { id: PatternId; label: string }[] = [
  { id: "plain", label: "Uni" },
  { id: "stripes-vertical", label: "Rayures verticales" },
  { id: "stripes-horizontal", label: "Rayures horizontales" },
  { id: "diagonal", label: "Bandes diagonales" },
  { id: "gradient", label: "Dégradé" },
  { id: "chevrons", label: "Géométrique" },
  { id: "waves", label: "Abstrait" },
  { id: "tonal", label: "Ton sur ton" },
  { id: "hex-tech", label: "Technique" },
];

export const NECK_STYLES: { id: NeckStyle; label: string }[] = [
  { id: "round", label: "Col rond" },
  { id: "v", label: "Col V" },
];

export const TEXT_FONTS: { id: TextFontId; label: string }[] = [
  { id: "oswald", label: "Classique" },
  { id: "bebas", label: "Condensée" },
  { id: "teko", label: "Technique" },
  { id: "anton", label: "Impact" },
  { id: "montserrat", label: "Lemnos" },
];

export const PLAYER_NAME_MAX = 14;

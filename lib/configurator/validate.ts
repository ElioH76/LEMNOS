import { DESIGN_ID_RE, defaultDesign, newDesignId } from "./defaults";
import { LOGO_SCALE_MAX, LOGO_SCALE_MIN } from "./layout";
import { getModel } from "./models";
import { NECK_STYLES, PLAYER_NAME_MAX, TEXT_FONTS } from "./options";
import {
  DESIGN_SCHEMA_VERSION,
  type ColorZone,
  type CustomLogo,
  type DesignConfig,
  type Hex,
  type PatternId,
} from "./types";

/**
 * Validation d'un design venant de l'extérieur (fichier JSON importé, lien
 * partagé, brouillon local, requête serveur). Ne fait JAMAIS confiance à
 * l'entrée : chaque champ est recopié un par un depuis une liste blanche,
 * borné, et remplacé par la valeur par défaut s'il est invalide. Tout champ
 * inconnu est ignoré — en particulier, aucune clé ne permet d'agir sur les
 * logos Lemnos, qui sont reconstruits depuis la définition du modèle.
 */

export const LOGO_DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
/** ~2 Mo d'image une fois décodée. */
export const LOGO_DATA_URL_MAX = 2_800_000;
export const MAX_CUSTOM_LOGOS = 8;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const KNOWN_KEYS = new Set([
  "schemaVersion",
  "designId",
  "modelId",
  "modelVersion",
  "colors",
  "pattern",
  "finish",
  "lemnosLogoColor",
  "customLogos",
  "playerText",
  "updatedAt",
]);

export interface SanitizeResult {
  design: DesignConfig;
  warnings: string[];
}

export interface SanitizeOptions {
  /** Accepter des URL https (logos déjà stockés côté serveur). */
  allowRemoteLogos?: boolean;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hex(v: unknown, fallback: Hex): Hex {
  return typeof v === "string" && HEX_RE.test(v) ? (v.toUpperCase() as Hex) : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Nom de joueur : capitales, lettres accentuées, chiffres, espace, tiret, apostrophe, point. */
export function cleanPlayerName(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .toUpperCase()
    .replace(/[^A-Z0-9À-ÖØ-Ý '.\-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, PLAYER_NAME_MAX);
}

/** Numéro : 0 à 99, sans zéro de tête superflu (« 07 » est accepté). */
export function cleanPlayerNumber(v: unknown): string {
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v).replace(/\D/g, "").slice(0, 2);
}

export function sanitizeDesign(input: unknown, options: SanitizeOptions = {}): SanitizeResult {
  const warnings: string[] = [];
  const base = defaultDesign();
  if (!isRecord(input)) return { design: base, warnings: ["Configuration illisible : design par défaut chargé."] };

  const ignored = Object.keys(input).filter((k) => !KNOWN_KEYS.has(k));
  if (ignored.length) warnings.push(`Champs non reconnus ignorés : ${ignored.slice(0, 6).join(", ")}.`);
  if (input.schemaVersion !== DESIGN_SCHEMA_VERSION) {
    warnings.push("Version de configuration différente : les valeurs ont été adaptées.");
  }

  const model = (typeof input.modelId === "string" && getModel(input.modelId)) || getModel(base.modelId)!;
  if (model.id !== input.modelId) warnings.push("Modèle inconnu : maillot manches courtes utilisé.");

  const colorsIn = isRecord(input.colors) ? input.colors : {};
  const colors = { ...base.colors };
  for (const zone of Object.keys(colors) as ColorZone[]) colors[zone] = hex(colorsIn[zone], base.colors[zone]);

  const patternIn = isRecord(input.pattern) ? input.pattern : {};
  const patternId = model.patterns.includes(patternIn.id as PatternId) ? (patternIn.id as PatternId) : "plain";
  const pattern = { id: patternId, scale: num(patternIn.scale, 0.5, 2, 1) };

  const finishIn = isRecord(input.finish) ? input.finish : {};
  const finish = {
    neck: NECK_STYLES.some((n) => n.id === finishIn.neck) ? (finishIn.neck as DesignConfig["finish"]["neck"]) : base.finish.neck,
    sidePanels: bool(finishIn.sidePanels, base.finish.sidePanels),
    cuffTrim: bool(finishIn.cuffTrim, base.finish.cuffTrim),
    hemTrim: bool(finishIn.hemTrim, base.finish.hemTrim),
    patternOnSleeves: bool(finishIn.patternOnSleeves, base.finish.patternOnSleeves),
  };

  const customLogos: CustomLogo[] = [];
  const usedZones = new Set<string>();
  const logosIn = Array.isArray(input.customLogos) ? input.customLogos.slice(0, MAX_CUSTOM_LOGOS) : [];
  let rejected = 0;
  for (const raw of logosIn) {
    if (!isRecord(raw)) {
      rejected++;
      continue;
    }
    const zone = model.customZones.find((z) => z.id === raw.zone);
    const src = typeof raw.src === "string" ? raw.src : "";
    const srcOk =
      (src.length <= LOGO_DATA_URL_MAX && LOGO_DATA_URL_RE.test(src)) ||
      (options.allowRemoteLogos === true && /^https:\/\/[^\s"'<>]+$/.test(src) && src.length < 2000);
    if (!zone || usedZones.has(zone.id) || !srcOk) {
      rejected++;
      continue;
    }
    usedZones.add(zone.id);
    customLogos.push({
      id: typeof raw.id === "string" && /^[a-z0-9-]{4,40}$/i.test(raw.id) ? raw.id : `logo-${zone.id}`,
      zone: zone.id,
      kind: raw.kind === "club" || raw.kind === "sponsor" ? raw.kind : zone.defaultKind,
      name: typeof raw.name === "string" ? raw.name.replace(/[<>]/g, "").slice(0, 120) : "logo",
      src,
      aspect: num(raw.aspect, 0.05, 20, 1),
      scale: num(raw.scale, LOGO_SCALE_MIN, LOGO_SCALE_MAX, 1),
      offsetX: num(raw.offsetX, -1, 1, 0),
      offsetY: num(raw.offsetY, -1, 1, 0),
    });
  }
  if (rejected) warnings.push(`${rejected} logo(s) ignoré(s) (format, taille ou emplacement invalide).`);

  const textIn = isRecord(input.playerText) ? input.playerText : {};
  const playerText = {
    enabled: bool(textIn.enabled, base.playerText.enabled),
    name: typeof textIn.name === "string" ? cleanPlayerName(textIn.name) : base.playerText.name,
    number: typeof textIn.number === "string" || typeof textIn.number === "number" ? cleanPlayerNumber(textIn.number) : base.playerText.number,
    font: TEXT_FONTS.some((f) => f.id === textIn.font) ? (textIn.font as DesignConfig["playerText"]["font"]) : base.playerText.font,
    color: hex(textIn.color, base.playerText.color),
    outline: bool(textIn.outline, base.playerText.outline),
    outlineColor: hex(textIn.outlineColor, base.playerText.outlineColor),
  };

  const design: DesignConfig = {
    schemaVersion: DESIGN_SCHEMA_VERSION,
    designId: typeof input.designId === "string" && DESIGN_ID_RE.test(input.designId) ? input.designId : newDesignId(),
    modelId: model.id,
    modelVersion: model.version,
    colors,
    pattern,
    finish,
    lemnosLogoColor: hex(input.lemnosLogoColor, base.lemnosLogoColor),
    customLogos,
    playerText,
    updatedAt: new Date().toISOString(),
  };
  return { design, warnings };
}

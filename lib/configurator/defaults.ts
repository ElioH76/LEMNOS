import { DEFAULT_MODEL_ID, getModel } from "./models";
import { DESIGN_SCHEMA_VERSION, type DesignConfig } from "./types";

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Identifiant de projet lisible, sans caractères ambigus (0/O, 1/I). */
export function newDesignId(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return `LMN-${Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("")}`;
}

export const DESIGN_ID_RE = /^LMN-[A-Z0-9]{6}$/;

/** Design de départ : maillot vert Lemnos, finitions blanches. */
export function defaultDesign(): DesignConfig {
  const model = getModel(DEFAULT_MODEL_ID)!;
  return {
    schemaVersion: DESIGN_SCHEMA_VERSION,
    designId: newDesignId(),
    modelId: model.id,
    modelVersion: model.version,
    colors: {
      body: "#1E5B3C",
      secondary: "#17472F",
      sleeves: "#1E5B3C",
      collar: "#FFFFFF",
      trim: "#FFFFFF",
      sidePanels: "#17472F",
    },
    pattern: { id: "plain", scale: 1 },
    finish: { neck: "round", sidePanels: true, cuffTrim: true, hemTrim: false, patternOnSleeves: false },
    lemnosLogoColor: "#FFFFFF",
    customLogos: [],
    playerText: {
      enabled: true,
      name: "LEMNOS",
      number: "10",
      font: "oswald",
      color: "#FFFFFF",
      outline: false,
      outlineColor: "#17472F",
    },
    updatedAt: new Date().toISOString(),
  };
}

import { jerseyShortSleeve } from "./jersey-ss";
import type { ProductModel } from "./types";

export type { ProductModel } from "./types";

/** Gel profond : les définitions de modèles (et leurs logos verrouillés) sont immuables. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) Object.freeze(value);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

/**
 * Produits RÉELLEMENT configurables. Ajouter un produit = une définition
 * (zones, logos verrouillés, géométrie) + son entrée ici.
 */
export const PRODUCT_MODELS: readonly ProductModel[] = deepFreeze([jerseyShortSleeve]);

export const DEFAULT_MODEL_ID = jerseyShortSleeve.id;

export function getModel(id: string): ProductModel | null {
  return PRODUCT_MODELS.find((m) => m.id === id) ?? null;
}

/**
 * Produits prévus mais NON configurables (pas encore de modèle 3D ni
 * d'emplacements Lemnos validés). Affichés uniquement comme « à venir ».
 */
export const UPCOMING_PRODUCTS = [
  "Short",
  "Chaussettes",
  "Maillot manches longues",
  "Maillot gardien",
  "Survêtement",
  "Coupe-vent",
] as const;

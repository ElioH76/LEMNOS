import "server-only";
import { del } from "@vercel/blob";

/**
 * Stockage de fichiers via Vercel Blob. Activé dès que `BLOB_READ_WRITE_TOKEN`
 * est présent (fourni par l'intégration Vercel Storage → Blob). Sans jeton, le
 * repli est une saisie d'URL manuelle côté UI — même philosophie de dégradation
 * gracieuse que Postgres → mémoire pour les données.
 *
 * L'upload lui-même se fait en direct depuis le navigateur (client upload), via
 * `app/api/blob/upload/route.ts` qui délivre un jeton court après contrôle admin.
 * Ce module regroupe le côté serveur : détection de configuration + suppression.
 */

export function isBlobConfigured(): boolean {
  return (process.env.BLOB_READ_WRITE_TOKEN ?? "").length > 0;
}

/** Supprime un blob par son URL. No-op silencieux si Blob n'est pas configuré. */
export async function deleteBlob(url: string): Promise<void> {
  if (!url || !isBlobConfigured()) return;
  try {
    await del(url);
  } catch (err) {
    // Suppression best-effort : ne jamais bloquer l'action métier appelante.
    console.error("[blob] del a échoué :", err);
  }
}

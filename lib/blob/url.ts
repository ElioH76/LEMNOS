/**
 * Helpers d'URL Blob — utilisables client ET serveur (pas de `server-only` ici).
 *
 * Le store Blob est en accès **privé** : les URL brutes ne sont pas lisibles
 * publiquement. L'affichage passe donc par le proxy authentifié
 * `app/api/blob/file`, qui vérifie la session admin et sert le fichier.
 *
 * Les URL non-Blob (repli « saisie manuelle » quand Blob n'est pas configuré,
 * ou logo hébergé ailleurs) sont laissées telles quelles.
 */

const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";

export function isVercelBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** Source affichable : proxy pour un blob privé Vercel, URL brute sinon. */
export function blobDisplaySrc(url: string): string {
  if (!url) return url;
  return isVercelBlobUrl(url) ? `/api/blob/file?url=${encodeURIComponent(url)}` : url;
}

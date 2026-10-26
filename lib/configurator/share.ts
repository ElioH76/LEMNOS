import type { DesignConfig } from "./types";

/**
 * Partage par lien : le design (hors images importées, trop lourdes pour une
 * URL) est sérialisé en base64url dans le fragment `#d=…`. Le fragment n'est
 * jamais envoyé au serveur ; à l'ouverture, il est relu puis VALIDÉ
 * (`sanitizeDesign`) avant d'être appliqué.
 */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64 + "===".slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeShareHash(design: DesignConfig): string {
  const { customLogos: _logos, ...rest } = design;
  return `d=${toBase64Url(JSON.stringify(rest))}`;
}

/** Renvoie l'objet brut (non validé) contenu dans le fragment, ou null. */
export function decodeShareHash(hash: string): unknown | null {
  const match = /(?:^#?|&)d=([A-Za-z0-9_-]{10,20000})/.exec(hash);
  if (!match) return null;
  try {
    return JSON.parse(fromBase64Url(match[1]));
  } catch {
    return null;
  }
}

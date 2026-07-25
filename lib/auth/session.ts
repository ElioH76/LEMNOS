/**
 * Session admin par mot de passe unique.
 * Le cookie porte un jeton = SHA-256("lemnos-admin::" + ADMIN_PASSWORD).
 * On ne stocke jamais le mot de passe en clair, et changer le mot de passe
 * invalide les sessions existantes. Web Crypto → fonctionne aussi dans le
 * middleware edge.
 */

export const SESSION_COOKIE = "lemnos_admin";

export function adminPasswordConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length > 0;
}

export async function sessionToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  const data = new TextEncoder().encode(`lemnos-admin::${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparaison à temps constant. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue || !adminPasswordConfigured()) return false;
  return safeEqual(cookieValue, await sessionToken());
}

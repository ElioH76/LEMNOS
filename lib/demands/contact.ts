/**
 * Champ « E-mail ou téléphone » du formulaire public : partagé entre la
 * validation client et l'action serveur.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Numéro plausible : chiffres, espaces, points, tirets, parenthèses, + initial ; 9 à 15 chiffres. */
export function isPhone(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[\d\s.\-()]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 9 && digits <= 15;
}

export function isValidContact(value: string): boolean {
  const v = value.trim();
  return EMAIL_RE.test(v) || isPhone(v);
}

/** Répartit la saisie dans les colonnes email / phone de la demande. */
export function splitContact(value: string): { email: string; phone: string } {
  const v = value.trim();
  return EMAIL_RE.test(v) ? { email: v, phone: "" } : { email: "", phone: v };
}

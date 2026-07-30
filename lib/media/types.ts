/**
 * Médiathèque — une entité unique `MediaAsset` couvre à la fois les designs
 * (module 3) et la médiathèque générale (module 5) : le champ `kind` distingue
 * design / logo / photo / document, et les liens optionnels `clientId` /
 * `orderId` rattachent un média à une fiche client et/ou une commande.
 *
 * Le fichier vit dans Vercel Blob (accès privé) ; on stocke ici ses métadonnées
 * et l'URL Blob (servie via le proxy `/api/blob/file`, jamais en direct).
 */

export type MediaKind = "design" | "logo" | "photo" | "document" | "autre";

export const MEDIA_KINDS: MediaKind[] = ["design", "logo", "photo", "document", "autre"];

export const MEDIA_KIND_LABEL: Record<MediaKind, string> = {
  design: "Design",
  logo: "Logo",
  photo: "Photo",
  document: "Document",
  autre: "Autre",
};

/** Badges — palette de la DA. Le vert marque « Design », le cœur de métier. */
export const MEDIA_KIND_STYLE: Record<MediaKind, string> = {
  design: "bg-green-soft text-green",
  logo: "bg-[#E4E7E6] text-ink",
  photo: "bg-status-design-bg text-status-design-fg",
  document: "bg-paper text-stone",
  autre: "bg-paper text-ash",
};

/** Métadonnées de fichier renvoyées par l'upload Blob (côté client). */
export interface UploadedFile {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
}

/** Données saisies/associées à un média (sans identité ni date). */
export interface MediaInput {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  kind: MediaKind;
  title: string;
  clientId: string | null;
  /** Nom du client figé (affichage sans jointure). */
  clientName: string;
  orderId: string | null;
  notes: string;
}

export interface MediaAsset extends MediaInput {
  id: string;
  createdAt: string;
}

/** Champs éditables après coup (le fichier lui-même ne change pas). */
export interface MediaMeta {
  kind: MediaKind;
  title: string;
  clientId: string | null;
  clientName: string;
  orderId: string | null;
  notes: string;
}

export function isImageType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/** Taille lisible : 1.4 Mo, 320 Ko… */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  const ko = bytes / 1024;
  if (ko < 1024) return `${ko.toFixed(ko < 10 ? 1 : 0)} Ko`;
  const mo = ko / 1024;
  return `${mo.toFixed(mo < 10 ? 1 : 0)} Mo`;
}

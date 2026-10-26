/**
 * Préparation des logos importés par le client, 100 % dans le navigateur :
 * - formats acceptés : PNG, JPEG, WebP, SVG ; 5 Mo maximum ;
 * - le SVG n'est JAMAIS injecté dans la page : il est chargé comme <img>
 *   (contexte où scripts et ressources externes sont désactivés) puis
 *   rastérisé — seul un PNG en sort ;
 * - toutes les images sont ré-encodées en PNG (suppression des métadonnées
 *   et de tout contenu caché), réduites à 1024 px et rognées de leurs marges
 *   transparentes.
 */

export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1024;

export interface PreparedLogo {
  src: string;
  aspect: number;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible ou corrompue."));
    img.src = url;
  });
}

/** Rogne les marges entièrement transparentes. */
function trimTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) throw new Error("L'image est entièrement transparente.");
  const w = right - left + 1;
  const h = bottom - top + 1;
  if (w === width && h === height) return canvas;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  return out;
}

export async function prepareLogoFile(file: File): Promise<PreparedLogo> {
  const type = file.type || (file.name.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "");
  if (!ACCEPTED_LOGO_TYPES.includes(type)) throw new Error("Format non pris en charge : PNG, JPEG, WebP ou SVG.");
  if (file.size > MAX_LOGO_FILE_BYTES) throw new Error("Fichier trop lourd (5 Mo maximum).");

  let url: string;
  if (type === "image/svg+xml") {
    const text = await file.text();
    if (!/<svg[\s>]/i.test(text)) throw new Error("Fichier SVG invalide.");
    url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  } else {
    url = URL.createObjectURL(file);
  }

  try {
    const img = await loadImage(url);
    let w = img.naturalWidth || 0;
    let h = img.naturalHeight || 0;
    // SVG sans dimensions intrinsèques : on prend un carré de travail.
    if (!w || !h) {
      w = MAX_SIDE;
      h = MAX_SIDE;
    }
    const ratio = Math.min(1, MAX_SIDE / Math.max(w, h));
    // Les petits SVG sont rendus en haute définition.
    const up = type === "image/svg+xml" ? MAX_SIDE / Math.max(w, h) : ratio;
    const cw = Math.max(1, Math.round(w * up));
    const ch = Math.max(1, Math.round(h * up));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    canvas.getContext("2d")!.drawImage(img, 0, 0, cw, ch);
    const trimmed = trimTransparent(canvas);
    let src = trimmed.toDataURL("image/png");
    if (src.length > 2_700_000) {
      // Photo très détaillée : on bascule en WebP compressé.
      src = trimmed.toDataURL("image/webp", 0.9);
    }
    if (src.length > 2_700_000) throw new Error("Image trop détaillée : utilisez un fichier plus léger.");
    return { src, aspect: trimmed.width / trimmed.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

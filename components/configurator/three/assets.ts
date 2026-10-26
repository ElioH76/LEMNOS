import * as THREE from "three";
import { LEMNOS_LOGO_CROPS, LEMNOS_LOGO_URL, type LemnosAsset } from "@/lib/configurator/brand";

/**
 * Chargement des ressources graphiques des décalcomanies :
 * - logo Lemnos OFFICIEL, lu depuis public/images/logo/LEMNOS.svg (aucun
 *   redessin) et rendu en blanc détouré — la couleur est appliquée par le
 *   matériau, ce qui garantit des proportions strictement identiques quelle
 *   que soit la couleur choisie ;
 * - images importées par le client (data URL déjà ré-encodées) ;
 * - textes de flocage.
 */

function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = src;
  });
}

export type LemnosTextures = Record<LemnosAsset, THREE.CanvasTexture>;

/** Charge le SVG officiel et produit une texture par cadrage (symbole, logo complet). */
export async function loadLemnosTextures(): Promise<LemnosTextures> {
  const res = await fetch(LEMNOS_LOGO_URL, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Logo officiel introuvable (${LEMNOS_LOGO_URL}, HTTP ${res.status}).`);
  const source = await res.text();
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName !== "svg" || doc.querySelector("parsererror")) throw new Error("Logo officiel illisible.");

  // L'aplat blanc (.st0) sert de fond / contre-forme dans le fichier d'origine.
  doc.querySelectorAll(".st0, style, script, foreignObject").forEach((el) => el.remove());
  const shapes = doc.querySelectorAll("path, polygon");
  if (shapes.length < 6) throw new Error("Logo officiel incomplet.");
  shapes.forEach((el) => {
    el.setAttribute("fill", "#ffffff");
    el.setAttribute("fill-rule", "evenodd");
  });

  const out = {} as LemnosTextures;
  for (const asset of Object.keys(LEMNOS_LOGO_CROPS) as LemnosAsset[]) {
    const crop = LEMNOS_LOGO_CROPS[asset];
    const heightPx = 1024;
    const widthPx = Math.round((heightPx * crop.w) / crop.h);
    svg.setAttribute("viewBox", `${crop.x} ${crop.y} ${crop.w} ${crop.h}`);
    svg.setAttribute("width", String(widthPx));
    svg.setAttribute("height", String(heightPx));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    try {
      const img = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = widthPx;
      canvas.height = heightPx;
      canvas.getContext("2d")!.drawImage(img, 0, 0, widthPx, heightPx);
      out[asset] = canvasTexture(canvas);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return out;
}

export async function loadImageTexture(src: string): Promise<THREE.CanvasTexture> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  return canvasTexture(canvas);
}

/** Texte de flocage → texture + ratio. Le contour est dessiné sous le remplissage. */
export function textTexture(
  text: string,
  fontFamily: string,
  weight: number,
  color: string,
  outline: string | null,
): { texture: THREE.CanvasTexture; aspect: number } {
  const size = 256;
  const pad = outline ? size * 0.12 : size * 0.06;
  const measure = document.createElement("canvas").getContext("2d")!;
  const font = `${weight} ${size}px ${fontFamily}`;
  measure.font = font;
  const metrics = measure.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || size * 0.75;
  const descent = metrics.actualBoundingBoxDescent || 0;
  const width = Math.ceil(metrics.width + pad * 2);
  const height = Math.ceil(ascent + descent + pad * 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, width);
  canvas.height = Math.max(8, height);
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  const x = canvas.width / 2;
  const y = pad + ascent;
  if (outline) {
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 0.11;
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  return { texture: canvasTexture(canvas), aspect: canvas.width / canvas.height };
}

import type { DesignConfig } from "@/lib/configurator/types";

/** Brouillon local et export / import de fichiers. */

const DRAFT_KEY = "lemnos.configurator.draft.v1";

export function loadDraft(): unknown | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Enregistre le brouillon. Si le quota du navigateur est dépassé (logos
 * lourds), on retombe sur un brouillon sans images. Renvoie le niveau atteint.
 */
export function saveDraft(design: DesignConfig): "full" | "without-logos" | "failed" {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(design));
    return "full";
  } catch {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...design, customLogos: [] }));
      return "without-logos";
    } catch {
      return "failed";
    }
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // stockage indisponible : rien à effacer
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDesignJson(design: DesignConfig) {
  const payload = JSON.stringify({ ...design, exportedAt: undefined }, null, 2);
  downloadBlob(new Blob([payload], { type: "application/json" }), `lemnos-${design.designId}.json`);
}

/** Planche d'aperçu : face + dos côte à côte, légende projet / club. */
export async function composeSheet(
  views: { front: string; back: string },
  opts: { designId: string; club: string; transparent: boolean },
): Promise<Blob> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Rendu illisible."));
      img.src = src;
    });
  const [front, back] = await Promise.all([load(views.front), load(views.back)]);
  const s = front.width;
  const footer = Math.round(s * 0.12);
  const canvas = document.createElement("canvas");
  canvas.width = s * 2;
  canvas.height = s + footer;
  const ctx = canvas.getContext("2d")!;
  if (!opts.transparent) {
    ctx.fillStyle = "#F4F4F2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(front, 0, 0);
  ctx.drawImage(back, s, 0);
  ctx.fillStyle = "#1A1D1F";
  ctx.font = `600 ${Math.round(footer * 0.26)}px Montserrat, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(`LEMNOS · ${opts.designId}${opts.club ? ` · ${opts.club}` : ""}`, s * 0.06, s + footer * 0.45);
  ctx.fillStyle = "#6B726D";
  ctx.font = `500 ${Math.round(footer * 0.2)}px Montserrat, system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Face  ·  Dos", s * 2 - s * 0.06, s + footer * 0.45);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export impossible."))), "image/png"),
  );
}

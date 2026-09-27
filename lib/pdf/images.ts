import "server-only";
import { get } from "@vercel/blob";
import sharp from "sharp";
import { isBlobConfigured } from "@/lib/blob/store";
import { isVercelBlobUrl } from "@/lib/blob/url";

export interface PdfImage {
  data: Buffer;
  format: "png" | "jpg";
}

/** Octets d'une image : Blob privé (via le jeton serveur) ou URL publique. */
async function readBytes(url: string): Promise<Buffer | null> {
  if (isVercelBlobUrl(url)) {
    if (!isBlobConfigured()) return null;
    const res = await get(url, { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }
  if (!/^https:\/\//.test(url)) return null;
  const res = await fetch(url);
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
}

/**
 * Image prête pour le PDF (react-pdf ne lit que PNG et JPEG) : tout format
 * (WebP, SVG, AVIF…) est converti, et redimensionné à `maxSize` px pour garder
 * des PDF légers. Renvoie null si l'image est illisible — le PDF se génère
 * quand même.
 */
export async function loadPdfImage(url: string, maxSize = 1800): Promise<PdfImage | null> {
  if (!url) return null;
  try {
    const bytes = await readBytes(url);
    if (!bytes) return null;
    const img = sharp(bytes, { density: 200 }).rotate().resize({
      width: maxSize,
      height: maxSize,
      fit: "inside",
      withoutEnlargement: true,
    });
    const meta = await sharp(bytes).metadata();
    if (meta.format === "jpeg") return { data: await img.jpeg({ quality: 88 }).toBuffer(), format: "jpg" };
    return { data: await img.png({ compressionLevel: 9 }).toBuffer(), format: "png" };
  } catch (err) {
    console.error("[pdf] image illisible :", url, err);
    return null;
  }
}

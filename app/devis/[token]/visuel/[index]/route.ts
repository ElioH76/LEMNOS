import { getDocumentByToken } from "@/lib/billing/store";
import { loadPdfImage } from "@/lib/pdf/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Visuel d'un devis, pour la page d'acceptation client. Accès par jeton secret
 * uniquement, et seulement pour les visuels que le devis affiche. L'image est
 * ré-encodée (PNG / JPEG) : jamais de SVG servi tel quel au navigateur.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; index: string }> }) {
  const { token, index } = await params;
  const doc = await getDocumentByToken(token);
  const visual = doc && doc.type === "devis" && doc.quoteStatus !== "brouillon" && doc.showVisuals ? doc.visuals[Number(index)] : undefined;
  if (!visual) return new Response("Introuvable", { status: 404 });

  const image = await loadPdfImage(visual.url, 1400);
  if (!image) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.format === "jpg" ? "image/jpeg" : "image/png",
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

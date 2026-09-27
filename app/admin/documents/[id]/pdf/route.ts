import { getDocument } from "@/lib/billing/store";
import { documentPdf } from "@/lib/pdf/archive";
import { pdfFileName } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF d'un devis / d'une facture / d'un avoir. Route sous /admin : protégée par
 * le middleware (session admin). `?inline=1` pour l'aperçu et l'impression.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) return new Response("Document introuvable", { status: 404 });

  const buffer = await documentPdf(doc);
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${pdfFileName(doc)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

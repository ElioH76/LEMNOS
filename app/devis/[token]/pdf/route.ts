import { getDocumentByToken } from "@/lib/billing/store";
import { documentPdf } from "@/lib/pdf/archive";
import { pdfFileName } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF d'un devis via son lien d'acceptation (jeton secret). Devis envoyés uniquement. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = await getDocumentByToken(token);
  if (!doc || doc.type !== "devis" || doc.quoteStatus === "brouillon") {
    return new Response("Introuvable", { status: 404 });
  }
  const buffer = await documentPdf(doc);
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${pdfFileName(doc)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

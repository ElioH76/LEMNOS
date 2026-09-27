import "server-only";
import { get, put } from "@vercel/blob";
import { isBlobConfigured } from "@/lib/blob/store";
import type { CommercialDocument } from "@/lib/billing/types";
import { pdfFileName, renderDocumentPdf } from "./render";

/**
 * Archivage du PDF d'un document émis dans le Blob PRIVÉ (même store que les
 * médias, jamais public). Le PDF archivé fait foi : c'est lui qui est servi
 * ensuite, même si la mise en page ou les paramètres évoluent.
 *
 * Sans Blob configuré, rien n'est archivé : le PDF est régénéré à la demande
 * à partir des données figées du document (snapshots), donc identique.
 */
export async function archivePdf(doc: CommercialDocument): Promise<string | null> {
  if (!isBlobConfigured() || !doc.number) return null;
  try {
    const buffer = await renderDocumentPdf(doc);
    const year = doc.date.slice(0, 4);
    const blob = await put(`documents/${year}/${pdfFileName(doc)}`, buffer, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    console.error("[pdf] archivage impossible :", err);
    return null;
  }
}

/** PDF d'un document : l'archive s'il existe, sinon rendu à la volée. */
export async function documentPdf(doc: CommercialDocument): Promise<Buffer> {
  if (doc.pdfUrl && isBlobConfigured()) {
    try {
      const res = await get(doc.pdfUrl, { access: "private" });
      if (res && res.statusCode === 200) return Buffer.from(await new Response(res.stream).arrayBuffer());
    } catch (err) {
      console.error("[pdf] archive illisible, régénération :", err);
    }
  }
  return renderDocumentPdf(doc);
}

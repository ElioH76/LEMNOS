import "server-only";
import path from "path";
import { createElement, type ReactElement } from "react";
import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { get } from "@vercel/blob";
import { DocumentPdf, type PdfContext } from "@/components/pdf/DocumentPdf";
import { isBlobConfigured } from "@/lib/blob/store";
import { isVercelBlobUrl } from "@/lib/blob/url";
import { sellerSnapshot, termsSnapshot } from "@/lib/billing/settings";
import { getDocument, getSettings } from "@/lib/billing/store";
import { documentTitle, type CommercialDocument } from "@/lib/billing/types";

/**
 * Point d'entrée unique de génération PDF (admin, lien client, email,
 * archivage). Un document émis est rendu avec SES snapshots (émetteur, banque,
 * mentions figés à l'émission) ; un brouillon avec les paramètres actuels.
 */

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  const dir = path.join(process.cwd(), "lib", "pdf", "fonts");
  Font.register({
    family: "Montserrat",
    fonts: [300, 400, 500, 600, 700].map((w) => ({ src: path.join(dir, `Montserrat-${w}.ttf`), fontWeight: w })),
  });
  Font.register({
    family: "Cinzel",
    fonts: [500, 700].map((w) => ({ src: path.join(dir, `Cinzel-${w}.ttf`), fontWeight: w })),
  });
  // Pas de césure automatique (les montants et références restent entiers).
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

async function loadLogo(url: string): Promise<PdfContext["logo"]> {
  if (!url) return null;
  try {
    let bytes: ArrayBuffer;
    let type = "";
    if (isVercelBlobUrl(url)) {
      if (!isBlobConfigured()) return null;
      const res = await get(url, { access: "private" });
      if (!res || res.statusCode !== 200) return null;
      bytes = await new Response(res.stream).arrayBuffer();
      type = res.blob.contentType ?? "";
    } else {
      const res = await fetch(url);
      if (!res.ok) return null;
      bytes = await res.arrayBuffer();
      type = res.headers.get("content-type") ?? "";
    }
    const format = type.includes("png") ? "png" : type.includes("jpeg") || type.includes("jpg") ? "jpg" : null;
    return format ? { data: Buffer.from(bytes), format } : null;
  } catch (err) {
    console.error("[pdf] logo illisible, emblème par défaut :", err);
    return null;
  }
}

export async function buildPdfContext(doc: CommercialDocument): Promise<PdfContext> {
  const settings = await getSettings();
  const frozen = doc.type === "devis" ? doc.quoteStatus !== "brouillon" : doc.lifecycle !== "brouillon";
  const seller = frozen && doc.seller ? doc.seller : sellerSnapshot(settings.company);
  const [quote, original] = await Promise.all([
    doc.quoteId && doc.type !== "devis" ? getDocument(doc.quoteId) : null,
    doc.invoiceId ? getDocument(doc.invoiceId) : null,
  ]);
  return {
    seller,
    bank: frozen && doc.bank ? doc.bank : { ...settings.bank },
    terms: frozen && doc.terms ? doc.terms : termsSnapshot(settings),
    slogan: settings.company.slogan,
    logo: await loadLogo(seller.logoUrl),
    quoteNumber: quote?.number ?? null,
    originalInvoice: original ? { number: original.number, date: original.date } : null,
  };
}

export async function renderDocumentPdf(doc: CommercialDocument): Promise<Buffer> {
  registerFonts();
  const ctx = await buildPdfContext(doc);
  const element = createElement(DocumentPdf, { doc, ctx }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export function pdfFileName(doc: CommercialDocument): string {
  const title = documentTitle(doc).replace(/[’']/g, "-").replace(/\s+/g, "-");
  return `${title}-${doc.number ?? "brouillon"}.pdf`.replace(/[^A-Za-z0-9._-]/g, "");
}

import "server-only";
import path from "path";
import { createElement, type ReactElement } from "react";
import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { DocumentPdf, type PdfContext } from "@/components/pdf/DocumentPdf";
import { sellerSnapshot, termsSnapshot } from "@/lib/billing/settings";
import { getDocument, getSettings } from "@/lib/billing/store";
import { documentTitle, type CommercialDocument } from "@/lib/billing/types";
import { loadPdfImage } from "./images";

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
    logo: await loadPdfImage(seller.logoUrl, 600),
    visuals: doc.showVisuals
      ? (
          await Promise.all(
            doc.visuals.map(async (v) => ({ title: v.title, image: await loadPdfImage(v.url) })),
          )
        ).filter((v): v is { title: string; image: NonNullable<typeof v.image> } => v.image !== null)
      : [],
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

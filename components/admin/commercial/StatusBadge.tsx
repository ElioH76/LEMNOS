import { cn } from "@/lib/cn";
import { invoiceStatus, quoteStatus } from "@/lib/billing/calc";
import {
  INVOICE_KIND_LABEL,
  INVOICE_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  type CommercialDocument,
  type InvoiceStatus,
  type QuoteStatus,
} from "@/lib/billing/types";

const QUOTE_STYLE: Record<QuoteStatus, string> = {
  brouillon: "bg-paper text-stone",
  envoye: "bg-[#E4E7E6] text-ink",
  accepte: "bg-green text-white",
  refuse: "bg-danger-soft text-danger",
  expire: "bg-[#FFF4E3] text-[#9A5A12]",
  annule: "bg-paper text-ash line-through",
};

const INVOICE_STYLE: Record<InvoiceStatus, string> = {
  brouillon: "bg-paper text-stone",
  non_payee: "bg-[#E4E7E6] text-ink",
  partielle: "bg-green-soft text-green",
  payee: "bg-green text-white",
  en_retard: "bg-danger-soft text-danger",
  annulee: "bg-paper text-ash line-through",
};

const BASE = "inline-block whitespace-nowrap rounded-pill px-3 py-1 text-[11px] font-semibold tracking-link";

/** Statut d'un document (devis, facture ou avoir), dérivé à l'affichage. */
export function DocStatusBadge({ doc }: { doc: CommercialDocument }) {
  if (doc.type === "devis") {
    const s = quoteStatus(doc);
    return <span className={cn(BASE, QUOTE_STYLE[s])}>{QUOTE_STATUS_LABEL[s]}</span>;
  }
  if (doc.type === "avoir") {
    return doc.lifecycle === "brouillon" ? (
      <span className={cn(BASE, QUOTE_STYLE.brouillon)}>Brouillon</span>
    ) : (
      <span className={cn(BASE, "bg-ink text-white")}>Émis</span>
    );
  }
  const s = invoiceStatus(doc);
  return <span className={cn(BASE, INVOICE_STYLE[s])}>{INVOICE_STATUS_LABEL[s]}</span>;
}

/** Nature d'une facture : Facture / Acompte / Solde / Avoir / Devis. */
export function DocKindBadge({ doc }: { doc: CommercialDocument }) {
  const label =
    doc.type === "devis"
      ? "Devis"
      : doc.type === "avoir"
        ? "Avoir"
        : doc.correctsId
          ? "Rectificative"
          : INVOICE_KIND_LABEL[doc.kind];
  const style =
    doc.type === "avoir"
      ? "border-ink/30 text-ink"
      : doc.kind === "acompte"
        ? "border-green/40 text-green"
        : "border-line text-stone";
  return <span className={cn("inline-block whitespace-nowrap rounded-sharp border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-caps", style)}>{label}</span>;
}

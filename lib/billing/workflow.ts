import { documentAmounts, invoiceStatus, quoteStatus } from "./calc";
import type { CommercialDocument } from "./types";

/**
 * Lecture du parcours commercial d'un devis (fonctions pures) :
 * BROUILLON → ENVOYÉ → ACCEPTÉ → FACTURE D'ACOMPTE → PRODUCTION → LIVRÉ →
 * FACTURE FINALE → PAYÉ.
 */

export function invoicesOfQuote(quoteId: string, all: CommercialDocument[]) {
  return all.filter((d) => d.type === "facture" && d.quoteId === quoteId && d.lifecycle !== "annulee");
}

/** Facture à générer ensuite depuis un devis accepté (null si rien à faire). */
export function nextInvoiceStep(quote: CommercialDocument, all: CommercialDocument[]): "acompte" | "finale" | null {
  if (quote.type !== "devis" || quote.quoteStatus !== "accepte") return null;
  const linked = invoicesOfQuote(quote.id, all);
  const deposit = linked.find((d) => d.kind === "acompte");
  const final = linked.find((d) => d.kind !== "acompte");
  if (final) return null;
  if (documentAmounts(quote).deposit > 0 && !deposit) return "acompte";
  if (deposit && deposit.lifecycle === "brouillon") return null;
  return "finale";
}

export interface WorkflowStep {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
  detail?: string;
}

export function quoteWorkflow(quote: CommercialDocument, all: CommercialDocument[]): WorkflowStep[] {
  const status = quoteStatus(quote);
  const linked = invoicesOfQuote(quote.id, all);
  const deposit = linked.find((d) => d.kind === "acompte");
  const final = linked.find((d) => d.kind !== "acompte");
  const hasDeposit = documentAmounts(quote).deposit > 0;
  const accepted = status === "accepte";
  const paid = !!final && final.lifecycle === "emise" && invoiceStatus(final) === "payee" &&
    (!deposit || invoiceStatus(deposit) === "payee");

  const steps: Omit<WorkflowStep, "current">[] = [
    { key: "brouillon", label: "Brouillon", done: true },
    { key: "envoye", label: "Envoyé", done: accepted || status === "envoye" || !!quote.sentAt },
    { key: "accepte", label: "Accepté", done: accepted },
  ];
  // Acompte prévu mais facturation en une fois (facture totale sans acompte) : étape retirée.
  if (hasDeposit && !(final && !deposit)) {
    steps.push({
      key: "acompte",
      label: "Facture d'acompte",
      done: !!deposit && deposit.lifecycle === "emise",
      detail: deposit ? (deposit.number ?? "brouillon") : undefined,
    });
  }
  steps.push(
    { key: "production", label: "Production", done: !!quote.fulfillment.productionAt },
    { key: "livre", label: "Livré", done: !!quote.fulfillment.deliveredAt },
    {
      key: "finale",
      label: "Facture finale",
      done: !!final && final.lifecycle === "emise",
      detail: final ? (final.number ?? "brouillon") : undefined,
    },
    { key: "paye", label: "Payé", done: paid },
  );

  const firstOpen = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, current: i === firstOpen && accepted }));
}

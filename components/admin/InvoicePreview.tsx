import { Mark } from "@/components/brand/Mark";
import { computeTotals, formatEuro, lineHt } from "@/lib/billing/calc";
import { company, companyAddressLine, companyLegalMentions } from "@/lib/settings/company";
import type { Invoice } from "@/lib/billing/types";

function frDate(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

/** Aperçu écran d'une facture — reflète le PDF. */
export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const t = computeTotals(invoice);
  const c = company;

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8 md:p-12">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-green">
            <Mark className="w-8 text-white" />
          </span>
          <div>
            <div className="text-[20px] font-extrabold uppercase tracking-wordmark">LEMNOS</div>
            <div className="text-[11px] text-ash">Forger vos idées</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[24px] font-extrabold tracking-tight text-green">FACTURE</div>
          <div className="font-mono text-[14px] font-bold">{invoice.number}</div>
        </div>
      </div>

      {/* Émetteur / Client */}
      <div className="mt-6 grid grid-cols-2 gap-6 text-[12.5px] leading-[1.6]">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-caps text-ash">Émetteur</div>
          <div className="font-bold">{c.name}</div>
          <div>{companyAddressLine()}</div>
          <div>{c.email}</div>
          <div>{c.phone}</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-caps text-ash">Facturé à</div>
          <div className="font-bold">{invoice.client.club}</div>
          {invoice.client.contact && <div>{invoice.client.contact}</div>}
          {invoice.client.address && <div>{invoice.client.address}</div>}
          <div>
            {[invoice.client.zip, invoice.client.city].filter(Boolean).join(" ")}
            {invoice.client.country ? `, ${invoice.client.country}` : ""}
          </div>
          {invoice.client.email && <div>{invoice.client.email}</div>}
          {invoice.client.phone && <div>{invoice.client.phone}</div>}
        </div>
      </div>

      {/* Dates */}
      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-paper px-4 py-3 text-[12.5px]">
        <span>
          <span className="text-ash">Date : </span>
          {frDate(invoice.date)}
        </span>
        <span>
          <span className="text-ash">Échéance : </span>
          {frDate(invoice.dueDate)}
        </span>
        {invoice.internalRef && (
          <span>
            <span className="text-ash">Réf. : </span>
            {invoice.internalRef}
          </span>
        )}
      </div>
      {invoice.projectRef && (
        <div className="mt-3 text-[12.5px]">
          <span className="font-semibold">Projet : </span>
          {invoice.projectRef}
        </div>
      )}

      {/* Lignes */}
      <table className="mt-6 w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b-2 border-ink text-left text-[10px] uppercase tracking-caps text-ash">
            <th className="py-2 pr-2 font-semibold">Désignation</th>
            <th className="px-2 py-2 text-right font-semibold">Qté</th>
            <th className="px-2 py-2 text-right font-semibold">PU HT</th>
            <th className="px-2 py-2 text-right font-semibold">TVA</th>
            <th className="py-2 pl-2 text-right font-semibold">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l) => (
            <tr key={l.id} className="border-b border-line">
              <td className="py-2.5 pr-2">
                {l.label}
                {l.discountValue > 0 && (
                  <span className="ml-1 text-[11px] text-ash">
                    (remise {l.discountType === "percent" ? `${l.discountValue}%` : formatEuro(l.discountValue)})
                  </span>
                )}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">{l.quantity}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{formatEuro(l.unitPriceHt)}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{l.vatRate}%</td>
              <td className="py-2.5 pl-2 text-right font-semibold tabular-nums">{formatEuro(lineHt(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totaux */}
      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-[280px] text-[13px]">
          <TotalRow label="Total HT" value={formatEuro(t.linesHt)} />
          {t.globalDiscount > 0 && <TotalRow label="Remise globale" value={`- ${formatEuro(t.globalDiscount)}`} />}
          {t.shipping > 0 && <TotalRow label="Frais de livraison" value={formatEuro(t.shipping)} />}
          {Object.entries(t.vatByRate).map(([rate, amount]) => (
            <TotalRow key={rate} label={`TVA ${rate}%`} value={formatEuro(amount)} muted />
          ))}
          <div className="my-1.5 flex items-center justify-between border-t border-ink pt-1.5">
            <span className="font-bold">Total TTC</span>
            <span className="text-[15px] font-extrabold tabular-nums">{formatEuro(t.totalTtc)}</span>
          </div>
          {t.deposit > 0 && <TotalRow label="Acompte payé" value={`- ${formatEuro(t.deposit)}`} muted />}
          <div className="mt-1.5 flex items-center justify-between rounded-md bg-green px-3 py-2.5">
            <span className="text-[13px] font-bold uppercase tracking-caps text-white">Total à payer</span>
            <span className="text-[19px] font-extrabold tabular-nums text-white">{formatEuro(t.remaining)}</span>
          </div>
        </div>
      </div>

      {/* Paiement / notes */}
      {(invoice.paymentTerms || invoice.notes || c.iban) && (
        <div className="mt-6 space-y-2 border-t border-line pt-5 text-[12px] leading-[1.6] text-stone">
          {invoice.paymentTerms && (
            <p>
              <span className="font-semibold text-ink">Conditions de paiement : </span>
              {invoice.paymentTerms}
            </p>
          )}
          {(c.iban || c.bic) && (
            <p>
              <span className="font-semibold text-ink">Coordonnées bancaires : </span>
              {[c.iban && `IBAN ${c.iban}`, c.bic && `BIC ${c.bic}`].filter(Boolean).join(" · ")}
            </p>
          )}
          {invoice.notes && <p>{invoice.notes}</p>}
        </div>
      )}

      {/* Mentions légales — adaptées au statut fiscal */}
      <div className="mt-6 border-t border-line pt-4 text-[10.5px] leading-[1.6] text-ash">
        {companyLegalMentions()}
      </div>
    </div>
  );
}

function TotalRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={muted ? "text-ash" : "text-slate"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-ash" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { QuoteAcceptForm } from "@/components/site/QuoteAcceptForm";
import { documentAmounts, formatEuro, frDate, lineHt, quoteStatus } from "@/lib/billing/calc";
import { getDocumentByToken, getSettings } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Votre devis — LEMNOS",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Page publique d'un devis (lien secret envoyé au client). N'affiche que le
 * contenu du devis : jamais de coordonnées bancaires, de commentaires internes
 * ni d'historique.
 */
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = await getDocumentByToken(token);
  if (!doc || doc.type !== "devis" || doc.quoteStatus === "brouillon") notFound();
  const settings = await getSettings();
  const seller = doc.seller ?? settings.company;
  const a = documentAmounts(doc);
  const status = quoteStatus(doc);

  return (
    <div className="min-h-screen bg-paper">
      <div className="h-2 bg-green" />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <LogoLockup markClassName="w-[26px] text-green" wordmarkClassName="text-[18px]" />
        <span className="hidden font-serif text-[11px] uppercase tracking-wide text-green sm:inline">{settings.company.slogan}</span>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-caps text-green">Devis</div>
              <h1 className="mt-1 font-mono text-[22px] font-extrabold">{doc.number}</h1>
              <p className="mt-1 text-[13.5px] text-slate">
                Pour <strong>{doc.client.club}</strong> · émis le {frDate(doc.date)} · valable jusqu&apos;au {frDate(doc.validUntil)}
              </p>
            </div>
            <a
              href={`/devis/${token}/pdf`}
              className="inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
            >
              <Download size={15} /> Télécharger le PDF
            </a>
          </div>

          {doc.subject && (
            <p className="mt-6 flex items-center gap-2 text-[14px] font-semibold">
              <FileText size={16} className="text-green" /> {doc.subject}
            </p>
          )}

          <div className="mt-4 divide-y divide-line-soft border-y border-line">
            {doc.lines.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-4 py-3.5 text-[14px]">
                <div className="min-w-0">
                  <div className="font-semibold">{l.label}</div>
                  {l.description && <div className="text-[12.5px] text-ash">{l.description}</div>}
                </div>
                <div className="whitespace-nowrap text-right tabular-nums">
                  <div className="text-[12px] text-ash">
                    {l.quantity} × {formatEuro(l.unitPriceHt)}
                  </div>
                  <div className="font-semibold">{formatEuro(lineHt(l))}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="ml-auto mt-4 flex max-w-sm flex-col gap-1.5 text-[14px] tabular-nums">
            <div className="flex justify-between text-slate">
              <span>Sous-total</span>
              <span>{formatEuro(a.subtotal)}</span>
            </div>
            {a.globalDiscount > 0 && (
              <div className="flex justify-between text-green">
                <span>{doc.globalDiscountLabel}</span>
                <span>−{formatEuro(a.globalDiscount)}</span>
              </div>
            )}
            {a.shipping > 0 && (
              <div className="flex justify-between text-slate">
                <span>Frais de livraison</span>
                <span>{formatEuro(a.shipping)}</span>
              </div>
            )}
            {!doc.vatExempt && (
              <div className="flex justify-between text-slate">
                <span>TVA</span>
                <span>{formatEuro(a.totalVat)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between rounded-xl bg-green px-4 py-3 text-white">
              <span className="text-[11px] font-semibold uppercase tracking-caps">Total</span>
              <span className="text-[20px] font-extrabold">{formatEuro(a.totalTtc)}</span>
            </div>
            {doc.vatExempt && (
              <p className="text-right text-[11.5px] font-semibold">{doc.terms?.vatMention ?? settings.company.vatMention}</p>
            )}
            {a.deposit > 0 && (
              <p className="text-right text-[12.5px] text-slate">
                Acompte à la commande : {formatEuro(a.deposit)} · solde à la livraison : {formatEuro(a.balance)}
              </p>
            )}
          </div>
          {(doc.deliveryLeadTime || doc.plannedDeliveryDate) && (
            <p className="mt-4 text-[13px] text-slate">
              Livraison prévisionnelle : {doc.plannedDeliveryDate ? frDate(doc.plannedDeliveryDate) : doc.deliveryLeadTime}
            </p>
          )}
          {doc.notes && <p className="mt-2 whitespace-pre-wrap text-[13px] text-slate">{doc.notes}</p>}
        </section>

        {doc.showVisuals && doc.visuals.length > 0 && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-caps text-green">Visuels du projet</h2>
            <div className={`mt-4 grid gap-4 ${doc.visuals.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {doc.visuals.map((v, i) => (
                <figure key={v.id} className="overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/devis/${token}/visuel/${i}`} alt={v.title} className="w-full bg-white object-contain p-3" loading="lazy" />
                  {v.title && <figcaption className="border-t border-line-soft px-3 py-2 text-center text-[13px] font-semibold">{v.title}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-8">
          {status === "accepte" && doc.acceptance ? (
            <div className="text-center">
              <CheckCircle2 size={34} className="mx-auto text-green" />
              <h2 className="mt-3 text-[18px] font-bold">Devis accepté — merci !</h2>
              <p className="mt-1 text-[13.5px] text-slate">
                Accepté le {frDate(doc.acceptance.date)} par {doc.acceptance.name}
                {doc.acceptance.role ? `, ${doc.acceptance.role}` : ""}. {seller.name} revient vers vous très vite pour la suite.
              </p>
            </div>
          ) : status === "envoye" ? (
            <>
              <h2 className="text-[18px] font-bold">Accepter le devis</h2>
              <p className="mb-5 mt-1 text-[13.5px] text-slate">
                Votre accord lance la commande (après règlement de l&apos;acompte, le cas échéant).
              </p>
              <QuoteAcceptForm
                token={token}
                total={formatEuro(a.totalTtc)}
                defaults={{ name: doc.client.contact, role: doc.client.contactRole, email: doc.client.email }}
              />
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-[17px] font-bold">
                {status === "expire" ? "Ce devis a expiré" : status === "refuse" ? "Ce devis a été refusé" : "Ce devis n'est plus valable"}
              </h2>
              <p className="mt-1 text-[13.5px] text-slate">
                Contactez-nous pour une proposition actualisée :{" "}
                <a className="text-green underline" href={`mailto:${seller.email}`}>
                  {seller.email}
                </a>
              </p>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-[11.5px] text-ash">
          {seller.name} · {[seller.address, [seller.zip, seller.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
          {seller.siret ? ` · SIRET ${seller.siret}` : ""}
        </p>
      </main>
    </div>
  );
}

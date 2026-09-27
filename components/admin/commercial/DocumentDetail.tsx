import Link from "next/link";
import { ArrowLeft, FileSignature, History, Link2, MessageSquareText } from "lucide-react";
import { documentAmounts, formatEuro, frDate, frDateTime, isEditable, lineHt } from "@/lib/billing/calc";
import { linkedDocuments } from "@/lib/billing/service";
import { getSettings, listInvoices } from "@/lib/billing/store";
import { displayNumber, documentTitle, type CommercialDocument } from "@/lib/billing/types";
import { blobDisplaySrc } from "@/lib/blob/url";
import { nextInvoiceStep, quoteWorkflow } from "@/lib/billing/workflow";
import { DocumentActions } from "./DocumentActions";
import { FulfillmentPanel, HistoryList, LinkedDocumentsList, PaymentsPanel, WorkflowStepper } from "./Panels";
import { DocKindBadge, DocStatusBadge } from "./StatusBadge";

/** Fiche d'un document (devis, facture, avoir) — partagée par /admin/devis et /admin/factures. */
export async function DocumentDetail({ doc }: { doc: CommercialDocument }) {
  const [all, linked, settings] = await Promise.all([listInvoices(), linkedDocuments(doc), getSettings()]);
  const a = documentAmounts(doc);
  const isQuote = doc.type === "devis";
  const next = nextInvoiceStep(doc, all);
  const quoteId = isQuote ? doc.id : doc.quoteId;
  const hasIssuedInvoices = isQuote && all.some((d) => d.quoteId === doc.id && d.type === "facture" && d.lifecycle === "emise");
  const hasCorrective = all.some((d) => d.correctsId === doc.id);
  const hasLinkedInvoices = isQuote && all.some((d) => d.quoteId === doc.id && d.type === "facture");
  const quote = quoteId ? all.find((d) => d.id === quoteId) : undefined;
  const linkedAmounts = Object.fromEntries(linked.map((d) => [d.id, documentAmounts(d).amountDue]));

  const warnings: string[] = [];
  if (!isQuote && doc.lifecycle === "brouillon") {
    if (!doc.client.address || !doc.client.city) warnings.push("L'adresse du client est incomplète (mention obligatoire).");
    if (doc.type === "facture" && doc.paymentMethod === "virement" && !settings.bank.iban)
      warnings.push("Aucun IBAN renseigné (Paramètres → Paiement) : les coordonnées bancaires n'apparaîtront pas.");
    if (!settings.company.siret) warnings.push("Le SIRET de l'entreprise n'est pas renseigné (Paramètres → Entreprise).");
    if (doc.type === "facture" && doc.quoteId && doc.kind !== "acompte" && !doc.deliveryDate)
      warnings.push("La date de livraison réelle n'est pas renseignée.");
  }

  const back = isQuote ? { href: "/admin/devis", label: "Retour aux devis" } : { href: "/admin/factures", label: "Retour aux factures" };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href={back.href} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green">
        <ArrowLeft size={15} /> {back.label}
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-[22px] font-extrabold tracking-tight sm:text-[26px]">{displayNumber(doc)}</h1>
        {!isQuote && <DocKindBadge doc={doc} />}
        <DocStatusBadge doc={doc} />
        {doc.archived && <span className="rounded-pill bg-paper px-3 py-1 text-[11px] font-semibold text-ash">Archivé</span>}
        {!isEditable(doc) && (
          <span className="text-[12px] text-ash">
            {isQuote ? "Verrouillé" : "Émis le " + frDate(doc.issuedAt ?? doc.date) + " · verrouillé"}
          </span>
        )}
      </div>

      <DocumentActions doc={doc} next={next} hasIssuedInvoices={hasIssuedInvoices} issueWarnings={warnings} hasCorrective={hasCorrective} hasLinkedInvoices={hasLinkedInvoices} />

      {isQuote && doc.quoteStatus !== "brouillon" && doc.quoteStatus !== "annule" && doc.quoteStatus !== "refuse" && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-caps text-ash">Parcours de la commande</div>
          <WorkflowStepper steps={quoteWorkflow(doc, all)} />
        </div>
      )}
      {!isQuote && quote && (
        <p className="mt-5 text-[13px] text-slate">
          Issue du devis{" "}
          <Link href={`/admin/devis/${quote.id}`} className="font-mono font-semibold text-green hover:underline">
            {quote.number}
          </Link>
          {doc.correctsId && " · facture rectificative"}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Récapitulatif */}
          <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">{documentTitle(doc)} · Client</div>
                <Link href={doc.clientId ? `/admin/clients/${doc.clientId}` : "#"} className="text-[17px] font-bold hover:text-green">
                  {doc.client.club}
                </Link>
                {doc.subject && <div className="mt-0.5 text-[13.5px] text-slate">{doc.subject}</div>}
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">
                  {isQuote ? "Total" : doc.type === "avoir" ? "Montant" : doc.kind === "acompte" ? "Acompte" : "Net à payer"}
                </div>
                <div className="text-[26px] font-extrabold tabular-nums text-green">{formatEuro(a.amountDue)}</div>
                {doc.vatExempt && <div className="text-[11px] text-ash">{settings.company.vatMention}</div>}
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line-soft pt-4 text-[13px] sm:grid-cols-4">
              <Info label={isQuote ? "Date du devis" : "Date"} value={doc.type !== "devis" && doc.lifecycle === "brouillon" ? "À l'émission" : frDate(doc.date)} />
              {isQuote ? (
                <>
                  <Info label="Valable jusqu'au" value={frDate(doc.validUntil)} />
                  <Info label="Livraison prévue" value={doc.plannedDeliveryDate ? frDate(doc.plannedDeliveryDate) : doc.deliveryLeadTime || "—"} />
                  <Info label="Acompte" value={a.deposit > 0 ? `${formatEuro(a.deposit)} · solde ${formatEuro(a.balance)}` : "Aucun"} />
                </>
              ) : (
                <>
                  <Info label="Échéance" value={doc.lifecycle === "brouillon" ? "Selon délai" : frDate(doc.dueDate)} />
                  <Info label="Livraison réelle" value={frDate(doc.deliveryDate)} />
                  <Info label="Envoyé" value={doc.sentAt ? frDate(doc.sentAt) : "Non"} />
                </>
              )}
            </dl>

            <div className="mt-5 divide-y divide-line-soft border-t border-line-soft">
              {doc.lines.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-3 py-3 text-[13.5px]">
                  <div className="min-w-0">
                    <div className="font-semibold">{l.label}</div>
                    {l.description && <div className="text-[12px] text-ash">{l.description}</div>}
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

            <div className="ml-auto mt-3 flex max-w-sm flex-col gap-1.5 border-t border-line pt-3 text-[13.5px] tabular-nums">
              <Line label="Sous-total" value={formatEuro(a.subtotal)} />
              {a.globalDiscount > 0 && <Line label={doc.globalDiscountLabel} value={`−${formatEuro(a.globalDiscount)}`} green />}
              {a.shipping > 0 && <Line label="Livraison" value={formatEuro(a.shipping)} />}
              {!doc.vatExempt && <Line label="TVA" value={formatEuro(a.totalVat)} />}
              <Line label={doc.vatExempt ? "Total" : "Total TTC"} value={formatEuro(a.totalTtc)} strong />
              {doc.kind === "acompte" && doc.type === "facture" && <Line label="Acompte facturé" value={formatEuro(a.amountDue)} strong />}
              {doc.deductions.map((d, i) => (
                <Line key={i} label={`${d.label}${d.number ? ` (${d.number})` : ""}`} value={`−${formatEuro(d.amount)}`} green />
              ))}
              {(doc.deductions.length > 0 || doc.kind === "acompte") && <Line label="Net à payer" value={formatEuro(a.amountDue)} strong />}
            </div>
          </section>

          {doc.visuals.length > 0 && (
            <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-bold">Visuels du projet</h2>
                <span className={`text-[12px] font-semibold ${doc.showVisuals ? "text-green" : "text-ash"}`}>
                  {doc.showVisuals ? "En annexe du PDF" : "Masqués sur le PDF"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {doc.visuals.map((v) => (
                  <figure key={v.id} className="overflow-hidden rounded-xl border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={blobDisplaySrc(v.url)} alt={v.title} className="aspect-square w-full object-contain p-2" loading="lazy" />
                    <figcaption className="truncate border-t border-line-soft px-2 py-1.5 text-[11.5px] text-slate">{v.title}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Aperçu PDF */}
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <h2 className="text-[14px] font-bold">Aperçu du PDF</h2>
              <a href={`/admin/documents/${doc.id}/pdf?inline=1`} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-green hover:underline">
                Ouvrir en plein écran →
              </a>
            </div>
            <iframe
              src={`/admin/documents/${doc.id}/pdf?inline=1#view=FitH`}
              title={`Aperçu ${displayNumber(doc)}`}
              className="hidden h-[900px] w-full bg-paper md:block"
            />
            <p className="px-5 py-4 text-[13px] text-ash md:hidden">L&apos;aperçu s&apos;ouvre dans un nouvel onglet sur mobile.</p>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {doc.type === "facture" && <PaymentsPanel doc={doc} amountDue={a.amountDue} paid={a.paid} outstanding={a.outstanding} />}
          {isQuote && doc.quoteStatus === "accepte" && <FulfillmentPanel doc={doc} />}

          {isQuote && doc.acceptance && (
            <Card title="Acceptation" icon={FileSignature}>
              <div className="text-[13px] leading-[1.6] text-slate">
                <div className="font-semibold text-ink">
                  {doc.acceptance.name}
                  {doc.acceptance.role ? `, ${doc.acceptance.role}` : ""}
                </div>
                <div>Le {frDate(doc.acceptance.date)} (enregistré le {frDateTime(doc.acceptance.at)})</div>
                {doc.acceptance.email && <div>{doc.acceptance.email}</div>}
                <div className="mt-1 text-[12px] text-ash">
                  {doc.acceptance.method === "admin"
                    ? "Enregistrée par LEMNOS"
                    : doc.acceptance.method === "en_ligne_signature"
                      ? "En ligne — signature manuscrite dessinée"
                      : "En ligne — case « Bon pour accord »"}
                  {doc.acceptance.note ? ` · ${doc.acceptance.note}` : ""}
                  {doc.acceptance.ip ? ` · IP ${doc.acceptance.ip}` : ""}
                </div>
                {doc.acceptance.signature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.acceptance.signature} alt="Signature" className="mt-2 h-16 rounded border border-line bg-white object-contain p-1" />
                )}
              </div>
            </Card>
          )}

          {doc.type === "avoir" && doc.reason && (
            <Card title="Motif de l'avoir" icon={MessageSquareText}>
              <p className="text-[13px] text-slate">{doc.reason}</p>
            </Card>
          )}

          <Card title="Documents liés" icon={Link2}>
            <LinkedDocumentsList docs={linked} currentId={doc.id} amounts={linkedAmounts} />
          </Card>

          {doc.internalComments && (
            <Card title="Commentaire interne" icon={MessageSquareText}>
              <p className="whitespace-pre-wrap text-[13px] text-slate">{doc.internalComments}</p>
              <p className="mt-1 text-[11px] text-ash">Jamais visible sur le PDF.</p>
            </Card>
          )}

          <Card title="Historique" icon={History}>
            <HistoryList events={doc.history} />
            <p className="mt-1 text-[11px] text-ash">
              Créé le {frDateTime(doc.createdAt)} · modifié le {frDateTime(doc.updatedAt)}
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-caps text-ash">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function Line({ label, value, strong, green }: { label: string; value: string; strong?: boolean; green?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${green ? "text-green" : ""} ${strong ? "font-bold" : "text-slate"}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof History; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold tracking-tight">
        <Icon size={15} className="text-green" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
}

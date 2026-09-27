import Link from "next/link";
import {
  AlarmClock,
  Banknote,
  FileCheck2,
  FileClock,
  FileSignature,
  FileText,
  HandCoins,
  Package,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { DocKindBadge, DocStatusBadge } from "@/components/admin/commercial/StatusBadge";
import { MemoryBanner } from "@/components/admin/commercial/MemoryBanner";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SectionHeading } from "@/components/admin/SectionHeading";
import { StatTile } from "@/components/admin/StatTile";
import { documentAmounts, formatEuro, frDate } from "@/lib/billing/calc";
import { computeBillingStats } from "@/lib/billing/stats";
import { listClients, listInvoices } from "@/lib/billing/store";
import { displayNumber, type CommercialDocument } from "@/lib/billing/types";
import { nextInvoiceStep } from "@/lib/billing/workflow";
import { listOrders } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [docs, clients, orders] = await Promise.all([listInvoices(), listClients(), listOrders()]);
  const stats = computeBillingStats(docs);
  const now = new Date();
  const active = docs.filter((d) => !d.archived);
  const quotes = active.filter((d) => d.type === "devis").slice(0, 5);
  const invoices = active.filter((d) => d.type !== "devis").slice(0, 5);
  const ordersInProgress = orders.filter((o) => o.status !== "livre").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-caps text-green">Espace admin</div>
          <h1 className="mt-1.5 text-[24px] font-extrabold tracking-tight sm:text-[28px]">Tableau de bord</h1>
          <div className="mt-1 text-[13px] capitalize text-ash">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Europe/Paris" }).format(now)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/devis/nouveau"
            className="inline-flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark"
          >
            <Plus size={16} aria-hidden /> Nouveau devis
          </Link>
          <Link
            href="/admin/factures/nouvelle"
            className="inline-flex items-center gap-2 rounded-sharp border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
          >
            <Receipt size={16} aria-hidden /> Facture
          </Link>
        </div>
      </div>

      <MemoryBanner />

      <SectionHeading icon={TrendingUp} className="mt-9">
        Chiffre d&apos;affaires
      </SectionHeading>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="CA facturé" value={formatEuro(stats.invoicedTotal)} sub={`${formatEuro(stats.invoicedYear)} en ${now.getFullYear()}`} icon={FileText} tone="green" href="/admin/factures" />
        <StatTile label="Encaissé" value={formatEuro(stats.collectedTotal)} sub={`${formatEuro(stats.collectedMonth)} ce mois-ci`} icon={Wallet} tone="green" />
        <StatTile
          label="À encaisser"
          value={formatEuro(stats.unpaidAmount)}
          sub={`${stats.unpaidCount} facture${stats.unpaidCount > 1 ? "s" : ""} en attente`}
          icon={Banknote}
          href="/admin/factures"
        />
        <StatTile
          label="En retard"
          value={String(stats.lateCount)}
          sub={stats.lateCount ? `${formatEuro(stats.lateAmount)} dus` : "Aucune facture en retard"}
          icon={AlarmClock}
          tone={stats.lateCount > 0 ? "warn" : "default"}
          href="/admin/factures"
        />
      </div>

      <SectionHeading icon={FileSignature} className="mt-10">
        Devis & acomptes
      </SectionHeading>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Devis en attente" value={String(stats.pendingQuotes)} sub="Envoyés, sans réponse" icon={FileClock} href="/admin/devis" />
        <StatTile label="Devis acceptés" value={String(stats.acceptedQuotes)} sub="Facturation à terminer" icon={FileCheck2} href="/admin/devis" />
        <StatTile label="Devis en cours" value={formatEuro(stats.openQuotesAmount)} sub="Brouillons + envoyés" icon={FileSignature} />
        <StatTile
          label="Acomptes à encaisser"
          value={formatEuro(stats.depositsDueAmount)}
          sub={`${stats.depositsDueCount} facture${stats.depositsDueCount > 1 ? "s" : ""} d'acompte`}
          icon={HandCoins}
          href="/admin/factures"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentList title="Devis" href="/admin/devis" empty="Aucun devis." docs={quotes} all={docs} />
        <RecentList title="Factures" href="/admin/factures" empty="Aucune facture." docs={invoices} all={docs} />
      </div>

      <SectionHeading icon={Wallet} className="mt-10">
        Encaissements {now.getFullYear()}
      </SectionHeading>
      <RevenueChart monthly={stats.monthly} currentMonth={now.getMonth()} />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <StatTile label="Clients" value={String(clients.length)} icon={Users} href="/admin/clients" />
        <StatTile label="Commandes en cours" value={String(ordersInProgress)} icon={Package} sub="Non encore livrées" href="/admin/commandes" />
      </div>
    </main>
  );
}

function RecentList({
  title,
  href,
  empty,
  docs,
  all,
}: {
  title: string;
  href: string;
  empty: string;
  docs: CommercialDocument[];
  all: CommercialDocument[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <Link href={href} className="text-[12px] font-semibold uppercase tracking-caps text-ash hover:text-green">
          Voir tout →
        </Link>
      </div>
      {docs.length === 0 ? (
        <p className="py-6 text-center text-[13.5px] text-ash">{empty}</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {docs.map((d) => {
            const base = d.type === "devis" ? "/admin/devis" : "/admin/factures";
            const next = nextInvoiceStep(d, all);
            return (
              <li key={d.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`${base}/${d.id}`} className="font-mono text-[13px] font-semibold hover:text-green">
                      {displayNumber(d)}
                    </Link>
                    <div className="truncate text-[13px] text-slate">{d.client.club}</div>
                    <div className="text-[11.5px] text-ash">{frDate(d.date)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[14px] font-bold tabular-nums">{formatEuro(documentAmounts(d).amountDue)}</span>
                    <div className="flex gap-1">
                      {d.type !== "devis" && <DocKindBadge doc={d} />}
                      <DocStatusBadge doc={d} />
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-3 text-[12px] font-semibold">
                  <Link href={`${base}/${d.id}`} className="text-ash hover:text-green">
                    Voir
                  </Link>
                  <a href={`/admin/documents/${d.id}/pdf`} className="text-ash hover:text-green">
                    PDF
                  </a>
                  {next && (
                    <Link href={`${base}/${d.id}`} className="text-green hover:underline">
                      {next === "acompte" ? "Créer la facture d'acompte" : "Créer la facture finale"}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

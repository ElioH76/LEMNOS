import {
  BadgeEuro,
  CalendarClock,
  FileText,
  Package,
  Percent,
  Timer,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { BarChart } from "@/components/admin/BarChart";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SectionHeading } from "@/components/admin/SectionHeading";
import { StatDistribution, type DistributionSegment } from "@/components/admin/StatDistribution";
import { StatTile } from "@/components/admin/StatTile";
import { TopClientsTable } from "@/components/admin/TopClientsTable";
import { formatEuro } from "@/lib/billing/calc";
import {
  MONTH_LABELS,
  computeBillingStats,
  computeInvoiceAnalytics,
  topClientsByRevenue,
} from "@/lib/billing/stats";
import { listInvoices, storageBackend } from "@/lib/billing/store";
import { computeOrderStats } from "@/lib/orders/stats";
import { listOrders } from "@/lib/orders/store";
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from "@/lib/billing/types";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders/types";

export const dynamic = "force-dynamic";

const INVOICE_SEGMENT_COLOR: Record<InvoiceStatus, string> = {
  payee: "bg-green",
  envoyee: "bg-green/40",
  brouillon: "bg-line-dark",
  annulee: "bg-danger/50",
};

const ORDER_SEGMENT_COLOR: Record<OrderStatus, string> = {
  design: "bg-line-dark",
  validation: "bg-green/25",
  production: "bg-green/50",
  expedition: "bg-green/75",
  livre: "bg-green",
};

export default async function StatistiquesPage() {
  const [invoices, orders] = await Promise.all([listInvoices(), listOrders()]);
  const now = new Date();

  const billing = computeBillingStats(invoices, now);
  const analytics = computeInvoiceAnalytics(invoices);
  const orderStats = computeOrderStats(orders, now);
  const topClients = topClientsByRevenue(invoices);

  const invoiceSegments: DistributionSegment[] = (
    ["payee", "envoyee", "brouillon", "annulee"] as InvoiceStatus[]
  ).map((s) => ({
    label: INVOICE_STATUS_LABEL[s],
    value: analytics.countByStatus[s],
    colorClass: INVOICE_SEGMENT_COLOR[s],
    hint: analytics.amountByStatus[s] > 0 ? formatEuro(analytics.amountByStatus[s]) : undefined,
  }));

  const orderSegments: DistributionSegment[] = ORDER_STATUSES.map((s) => ({
    label: ORDER_STATUS_LABEL[s],
    value: orderStats.byStatus[s],
    colorClass: ORDER_SEGMENT_COLOR[s],
  }));

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">Statistiques</h1>
          </div>
          <div className="text-[13px] capitalize text-ash">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(now)}
          </div>
        </div>

        {storageBackend() === "memory" && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Les statistiques sont
            calculées à partir des données en mémoire (perdues au redéploiement tant que la base
            Postgres n'est pas branchée).
          </div>
        )}

        {/* Chiffre d'affaires */}
        <SectionHeading className="mt-10" icon={TrendingUp}>Chiffre d&apos;affaires</SectionHeading>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="CA du mois" value={formatEuro(billing.caMonth)} icon={Wallet} tone="green" />
          <StatTile label="CA de l'année" value={formatEuro(billing.caYear)} icon={BadgeEuro} tone="green" />
          <StatTile label="CA total" value={formatEuro(billing.caTotal)} icon={TrendingUp} tone="green" />
          <StatTile
            label="Panier moyen"
            value={formatEuro(analytics.avgPaidInvoice)}
            icon={BadgeEuro}
            sub="Par facture payée"
          />
        </div>

        <div className="mt-4">
          <RevenueChart monthly={billing.monthly} currentMonth={now.getMonth()} />
        </div>

        {/* Facturation */}
        <SectionHeading className="mt-10" icon={FileText}>Facturation</SectionHeading>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid grid-cols-2 gap-4 self-start">
            <StatTile label="Factures" value={String(analytics.invoiceCount)} icon={FileText} />
            <StatTile
              label="Taux de règlement"
              value={`${analytics.collectionRate}%`}
              icon={Percent}
              sub="Payées / (payées + envoyées)"
            />
            <StatTile
              label="Impayées"
              value={String(billing.unpaidCount)}
              icon={CalendarClock}
              tone={billing.unpaidCount > 0 ? "warn" : "default"}
              sub={billing.unpaidAmount > 0 ? `${formatEuro(billing.unpaidAmount)} à encaisser` : undefined}
            />
            <StatTile label="Devis en attente" value={String(billing.pendingQuotes)} icon={FileText} />
          </div>
          <Card title="Répartition des factures">
            <StatDistribution segments={invoiceSegments} />
          </Card>
        </div>

        {/* Commandes */}
        <SectionHeading className="mt-10" icon={Package}>Commandes</SectionHeading>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="En cours" value={String(orderStats.inProgress)} icon={Package} tone="green" />
          <StatTile label="Livrées (année)" value={String(orderStats.deliveredYear)} icon={Package} />
          <StatTile label="Total commandes" value={String(orderStats.total)} icon={Package} />
          <StatTile
            label="Délai moyen"
            value={orderStats.avgLeadTimeDays === null ? "—" : `${orderStats.avgLeadTimeDays} j`}
            icon={Timer}
            sub="Création → livraison"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <Card title="Pipeline par étape">
            <StatDistribution segments={orderSegments} />
          </Card>
          <Card title="Livraisons par mois" hint={`${orderStats.deliveredYear} en ${now.getFullYear()}`}>
            <div className="mt-2">
              <BarChart
                values={orderStats.monthlyDelivered}
                labels={MONTH_LABELS}
                highlightIndex={now.getMonth()}
              />
            </div>
          </Card>
        </div>

        {/* Top clients */}
        <SectionHeading className="mt-10" icon={Trophy}>Meilleurs clients</SectionHeading>
        <Card title="Classement par CA encaissé">
          <TopClientsTable clients={topClients} />
        </Card>

        <div className="h-6" />
      </main>
    </>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
        {hint && <span className="text-[12px] text-ash">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

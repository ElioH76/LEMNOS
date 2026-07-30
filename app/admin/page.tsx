import Link from "next/link";
import { AlertTriangle, FileClock, FileText, Package, Users } from "lucide-react";
import { StatTile } from "@/components/admin/StatTile";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";
import { computeTotals, formatEuro } from "@/lib/billing/calc";
import { computeBillingStats } from "@/lib/billing/stats";
import { listClients, listInvoices, storageBackend } from "@/lib/billing/store";
import { listOrders } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [invoices, savedClients, orders] = await Promise.all([
    listInvoices(),
    listClients(),
    listOrders(),
  ]);

  const stats = computeBillingStats(invoices);

  // Clients distincts : carnet + clients figés sur les factures (par nom).
  const clientNames = new Set<string>();
  for (const c of savedClients) if (c.club) clientNames.add(c.club.trim().toLowerCase());
  for (const i of invoices) if (i.client.club) clientNames.add(i.client.club.trim().toLowerCase());
  const clientCount = clientNames.size;

  const ordersInProgress = orders.filter((o) => o.status !== "livre").length;
  const now = new Date();
  const recent = invoices.slice(0, 5);

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">Tableau de bord</h1>
          </div>
          <div className="text-[13px] capitalize text-ash">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(now)}
          </div>
        </div>

        {storageBackend() === "memory" && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Sans base de données,
            les données sont en mémoire et perdues au redéploiement. La base Vercel Postgres active la
            persistance.
          </div>
        )}

        {/* Indicateurs d'activité */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Clients" value={String(clientCount)} icon={Users} />
          <StatTile
            label="Devis en attente"
            value={String(stats.pendingQuotes)}
            icon={FileClock}
            sub="Module devis à venir"
          />
          <StatTile
            label="Factures impayées"
            value={String(stats.unpaidCount)}
            sub={stats.unpaidAmount > 0 ? `${formatEuro(stats.unpaidAmount)} à encaisser` : undefined}
            icon={AlertTriangle}
            tone={stats.unpaidCount > 0 ? "warn" : "default"}
            href="/admin/factures"
          />
          <StatTile
            label="Commandes en cours"
            value={String(ordersInProgress)}
            icon={Package}
            sub="Non encore livrées"
            href="/admin/commandes"
          />
        </div>

        {/* Chiffre d'affaires */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="CA du mois" value={formatEuro(stats.caMonth)} tone="green" />
          <StatTile label="CA de l'année" value={formatEuro(stats.caYear)} tone="green" />
          <StatTile label="CA total" value={formatEuro(stats.caTotal)} tone="green" />
        </div>

        <div className="mt-6">
          <RevenueChart monthly={stats.monthly} currentMonth={now.getMonth()} />
        </div>

        {/* Dernières factures */}
        <div className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
              <FileText size={16} className="text-green" aria-hidden /> Dernières factures
            </h2>
            <Link
              href="/admin/factures"
              className="text-[12px] font-semibold uppercase tracking-caps text-ash transition-colors hover:text-green"
            >
              Voir tout →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-center text-[14px] text-ash">
              Aucune facture. <Link href="/admin/factures/nouvelle" className="text-green underline">Créer la première</Link>.
            </p>
          ) : (
            <div className="mt-4 flex flex-col divide-y divide-line-soft">
              {recent.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/admin/factures/${inv.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-paper/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-semibold">{inv.number}</span>
                    <span className="text-[13.5px] text-slate">{inv.client.club || "—"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13.5px] font-semibold tabular-nums">
                      {formatEuro(computeTotals(inv).totalTtc)}
                    </span>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

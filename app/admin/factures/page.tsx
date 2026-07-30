import Link from "next/link";
import { Plus } from "lucide-react";
import { InvoicesTable } from "@/components/admin/InvoicesTable";
import { computeTotals, formatEuro } from "@/lib/billing/calc";
import { listInvoices, storageBackend } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const invoices = await listInvoices();
  const backend = storageBackend();

  const paidTtc = invoices
    .filter((i) => i.status === "payee")
    .reduce((sum, i) => sum + computeTotals(i).totalTtc, 0);
  const openTtc = invoices
    .filter((i) => i.status === "envoyee")
    .reduce((sum, i) => sum + computeTotals(i).remaining, 0);

  return (
    <>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">Factures</h1>
          </div>
          <Link
            href="/admin/factures/nouvelle"
            className="flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark"
          >
            <Plus size={16} aria-hidden />
            Nouvelle facture
          </Link>
        </div>

        {backend === "memory" && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Sans base de données,
            les factures sont conservées en mémoire et perdues au redéploiement. La base Vercel
            Postgres (variable <code className="rounded bg-white/60 px-1">DATABASE_URL</code>) active
            la persistance.
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Factures" value={String(invoices.length)} />
          <StatCard label="Encaissé (payées)" value={formatEuro(paidTtc)} tone="green" />
          <StatCard label="En attente (envoyées)" value={formatEuro(openTtc)} />
        </div>

        <div className="mt-10">
          <InvoicesTable invoices={invoices} />
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">{label}</div>
      <div
        className={`mt-2 text-[26px] font-extrabold tabular-nums ${tone === "green" ? "text-green" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

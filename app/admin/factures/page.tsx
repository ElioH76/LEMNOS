import Link from "next/link";
import { Plus } from "lucide-react";
import { DocumentsTable, type DocumentRow } from "@/components/admin/commercial/DocumentsTable";
import { MemoryBanner } from "@/components/admin/commercial/MemoryBanner";
import { PageHeader } from "@/components/admin/commercial/ui";
import { StatTile } from "@/components/admin/StatTile";
import { documentAmounts, formatEuro } from "@/lib/billing/calc";
import { computeBillingStats } from "@/lib/billing/stats";
import { listInvoices } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const all = await listInvoices();
  const numbers = new Map(all.map((d) => [d.id, d.number]));
  const rows: DocumentRow[] = all
    .filter((d) => d.type !== "devis")
    .map((doc) => {
      const a = documentAmounts(doc);
      return {
        doc,
        amount: a.amountDue,
        outstanding: doc.type === "facture" && doc.lifecycle === "emise" ? a.outstanding : 0,
        next: null,
        quoteNumber: doc.quoteId ? (numbers.get(doc.quoteId) ?? null) : null,
      };
    });
  const stats = computeBillingStats(all);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Factures">
        <Link
          href="/admin/factures/nouvelle"
          className="inline-flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark"
        >
          <Plus size={16} aria-hidden /> Nouvelle facture
        </Link>
      </PageHeader>
      <MemoryBanner />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="CA facturé" value={formatEuro(stats.invoicedTotal)} tone="green" />
        <StatTile label="Encaissé" value={formatEuro(stats.collectedTotal)} tone="green" />
        <StatTile label="À encaisser" value={formatEuro(stats.unpaidAmount)} sub={`${stats.unpaidCount} facture${stats.unpaidCount > 1 ? "s" : ""}`} />
        <StatTile
          label="En retard"
          value={formatEuro(stats.lateAmount)}
          sub={`${stats.lateCount} facture${stats.lateCount > 1 ? "s" : ""}`}
          tone={stats.lateCount > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-10">
        <DocumentsTable rows={rows} kind="factures" />
      </div>
    </main>
  );
}

import Link from "next/link";
import { Plus } from "lucide-react";
import { DocumentsTable, type DocumentRow } from "@/components/admin/commercial/DocumentsTable";
import { MemoryBanner } from "@/components/admin/commercial/MemoryBanner";
import { PageHeader } from "@/components/admin/commercial/ui";
import { documentAmounts } from "@/lib/billing/calc";
import { listInvoices } from "@/lib/billing/store";
import { nextInvoiceStep } from "@/lib/billing/workflow";

export const dynamic = "force-dynamic";

export default async function DevisPage() {
  const all = await listInvoices();
  const rows: DocumentRow[] = all
    .filter((d) => d.type === "devis")
    .map((doc) => ({
      doc,
      amount: documentAmounts(doc).totalTtc,
      outstanding: 0,
      next: nextInvoiceStep(doc, all),
      quoteNumber: null,
    }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Devis">
        <Link
          href="/admin/devis/nouveau"
          className="inline-flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark"
        >
          <Plus size={16} aria-hidden /> Nouveau devis
        </Link>
      </PageHeader>
      <MemoryBanner />
      <div className="mt-8">
        <DocumentsTable rows={rows} kind="devis" />
      </div>
    </main>
  );
}

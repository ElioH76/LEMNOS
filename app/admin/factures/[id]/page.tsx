import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InvoiceActionsBar } from "@/components/admin/InvoiceActionsBar";
import { InvoicePreview } from "@/components/admin/InvoicePreview";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";
import { getInvoice } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function FacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <>
      <AdminHeader active="factures" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/admin/factures"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour aux factures
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-[24px] font-extrabold tracking-tight">{invoice.number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <InvoiceActionsBar id={invoice.id} number={invoice.number} />
        </div>

        {invoice.internalComments && (
          <div className="mb-6 rounded-2xl border border-line bg-paper px-5 py-3 text-[13px] text-stone">
            <span className="font-semibold text-ink">Note interne : </span>
            {invoice.internalComments}
            <span className="ml-1 text-[11px] text-ash">(non visible sur le PDF)</span>
          </div>
        )}

        <InvoicePreview invoice={invoice} />
      </main>
    </>
  );
}

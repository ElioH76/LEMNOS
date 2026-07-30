import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { getInvoice, listClients, listProductTemplates } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function ModifierFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clients, templates] = await Promise.all([
    getInvoice(id),
    listClients(),
    listProductTemplates(),
  ]);
  if (!invoice) notFound();

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href={`/admin/factures/${invoice.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour à la facture
        </Link>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">
          Modifier {invoice.number}
        </h1>
        <InvoiceForm mode="edit" initial={invoice} clients={clients} templates={templates} />
      </main>
    </>
  );
}

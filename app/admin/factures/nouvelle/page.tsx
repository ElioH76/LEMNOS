import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { listClients, listProductTemplates } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function NouvelleFacturePage() {
  const [clients, templates] = await Promise.all([listClients(), listProductTemplates()]);

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
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">Nouvelle facture</h1>
        <InvoiceForm mode="create" clients={clients} templates={templates} />
      </main>
    </>
  );
}

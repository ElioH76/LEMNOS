import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderForm, type ClientOption, type InvoiceOption } from "@/components/admin/OrderForm";
import { listClients, listInvoices } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const [clients, invoices] = await Promise.all([listClients(), listInvoices()]);

  const clientOptions: ClientOption[] = clients.map((c) => ({ id: c.id, club: c.club }));
  const invoiceOptions: InvoiceOption[] = invoices.map((i) => ({
    id: i.id,
    number: i.number,
    clientName: i.client.club,
  }));

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/admin/commandes"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour aux commandes
        </Link>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">Nouvelle commande</h1>
        <OrderForm
          mode="create"
          clients={clientOptions}
          invoices={invoiceOptions}
          presetClientId={client}
        />
      </main>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OrderForm, type ClientOption, type InvoiceOption } from "@/components/admin/OrderForm";
import { listClients, listInvoices } from "@/lib/billing/store";
import { getOrder } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

export default async function ModifierCommandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, clients, invoices] = await Promise.all([
    getOrder(id),
    listClients(),
    listInvoices(),
  ]);
  if (!order) notFound();

  const clientOptions: ClientOption[] = clients.map((c) => ({ id: c.id, club: c.club }));
  const invoiceOptions: InvoiceOption[] = invoices.map((i) => ({
    id: i.id,
    number: i.number,
    clientName: i.client.club,
  }));

  return (
    <>
      <AdminHeader active="commandes" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/admin/commandes/${order.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green"
        >
          <ArrowLeft size={15} /> Retour à la commande
        </Link>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight">
          Modifier <span className="font-mono">{order.number}</span>
        </h1>
        <OrderForm mode="edit" clients={clientOptions} invoices={invoiceOptions} initial={order} />
      </main>
    </>
  );
}

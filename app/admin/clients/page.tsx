import Link from "next/link";
import { Plus } from "lucide-react";
import { ClientsTable, type ClientRow } from "@/components/admin/ClientsTable";
import { computeTotals } from "@/lib/billing/calc";
import { listClients, listInvoices, storageBackend } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, invoices] = await Promise.all([listClients(), listInvoices()]);

  const rows: ClientRow[] = clients.map((client) => {
    const club = client.club.trim().toLowerCase();
    const linked = invoices.filter(
      (i) => i.clientId === client.id || (!i.clientId && i.client.club.trim().toLowerCase() === club),
    );
    const ca = linked
      .filter((i) => i.status === "payee")
      .reduce((sum, i) => sum + computeTotals(i).totalTtc, 0);
    return { client, invoiceCount: linked.length, ca };
  });

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">Clients</h1>
          </div>
          <Link
            href="/admin/clients/nouveau"
            className="flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark"
          >
            <Plus size={16} aria-hidden />
            Nouveau client
          </Link>
        </div>

        {storageBackend() === "memory" && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Sans base de données,
            les fiches clients sont en mémoire et perdues au redéploiement.
          </div>
        )}

        <div className="mt-8">
          <ClientsTable rows={rows} />
        </div>
      </main>
    </>
  );
}

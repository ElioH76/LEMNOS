import Link from "next/link";
import { formatEuro } from "@/lib/billing/calc";
import type { ClientRevenue } from "@/lib/billing/stats";

/** Classement des clients par CA encaissé. */
export function TopClientsTable({ clients }: { clients: ClientRevenue[] }) {
  if (clients.length === 0) {
    return <p className="py-4 text-center text-[13.5px] text-ash">Aucune donnée client pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-line-soft">
      {clients.map((c, i) => {
        const inner = (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 flex-none text-center text-[12px] font-bold tabular-nums text-ash">
                {i + 1}
              </span>
              <span className="truncate font-semibold text-ink">{c.name}</span>
              <span className="flex-none text-[11.5px] text-ash">
                {c.invoiceCount} facture{c.invoiceCount > 1 ? "s" : ""}
              </span>
            </div>
            <span className="flex-none font-semibold tabular-nums text-green">{formatEuro(c.caPaid)}</span>
          </>
        );

        return c.clientId ? (
          <Link
            key={c.key}
            href={`/admin/clients/${c.clientId}`}
            className="flex items-center justify-between gap-3 py-3 text-[13.5px] transition-colors hover:bg-paper/60"
          >
            {inner}
          </Link>
        ) : (
          <div key={c.key} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

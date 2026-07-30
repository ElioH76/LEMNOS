import { DemandsBoard } from "@/components/admin/DemandsBoard";
import { listDemands, storageBackend } from "@/lib/demands/store";
import { DEMAND_STATUSES, STATUS_LABEL } from "@/lib/demands/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demands = await listDemands();
  const backend = storageBackend();
  const counts = DEMAND_STATUSES.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    value: demands.filter((d) => d.status === status).length,
  }));

  return (
    <>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">
              Demandes de projet
            </h1>
          </div>
          <div className="text-[13px] text-ash">
            {demands.length} demande{demands.length > 1 ? "s" : ""} au total
          </div>
        </div>

        {backend === "memory" && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Aucune base de données
            n&apos;est branchée : les demandes sont conservées en mémoire et seront perdues au prochain
            redéploiement. Ajoute une base Vercel Postgres et la variable{" "}
            <code className="rounded bg-white/60 px-1">DATABASE_URL</code> pour activer la persistance.
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {counts.map((stat) => (
            <div key={stat.status} className="rounded-2xl border border-line bg-white px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">
                {stat.label}
              </div>
              <div className="mt-2 text-[30px] font-extrabold tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <DemandsBoard demands={demands} />
        </div>
      </main>
    </>
  );
}

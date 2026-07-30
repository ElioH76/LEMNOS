import { AdminHeader } from "@/components/admin/AdminHeader";
import { MediaGrid } from "@/components/admin/MediaGrid";
import { MediaUploader, type ClientOption } from "@/components/admin/MediaUploader";
import { isBlobConfigured } from "@/lib/blob/store";
import { listClients } from "@/lib/billing/store";
import { listMedia, storageBackend } from "@/lib/media/store";
import { formatBytes } from "@/lib/media/types";

export const dynamic = "force-dynamic";

export default async function MediathequePage() {
  const [assets, clients] = await Promise.all([listMedia(), listClients()]);
  const blobOn = isBlobConfigured();

  const clientOptions: ClientOption[] = clients.map((c) => ({ id: c.id, club: c.club }));
  const totalSize = assets.reduce((s, a) => s + (a.size || 0), 0);
  const designs = assets.filter((a) => a.kind === "design").length;

  return (
    <>
      <AdminHeader active="mediatheque" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">Médiathèque</h1>
            <p className="mt-1 text-[13px] text-ash">
              Designs, logos et fichiers — stockés en privé, liés aux clients et commandes.
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <Stat label="Fichiers" value={String(assets.length)} />
            <Stat label="Designs" value={String(designs)} />
            <Stat label="Espace" value={formatBytes(totalSize)} />
          </div>
        </div>

        {!blobOn && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage de fichiers inactif.</strong> Ajoutez la variable{" "}
            <code className="rounded bg-white/60 px-1">BLOB_READ_WRITE_TOKEN</code> (Vercel → Storage →
            Blob) pour activer le téléversement.
          </div>
        )}

        {storageBackend() === "memory" && (
          <div className="mt-4 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Les métadonnées des médias
            sont en mémoire (perdues au redéploiement tant que la base Postgres n'est pas branchée).
          </div>
        )}

        {blobOn && (
          <div className="mt-8">
            <MediaUploader clients={clientOptions} />
          </div>
        )}

        <div className="mt-8">
          <MediaGrid assets={assets} />
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">{label}</div>
      <div className="mt-1 text-[22px] font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

import Link from "next/link";
import { Plus } from "lucide-react";
import { SuppliersTable } from "@/components/admin/SuppliersTable";
import { listSuppliers, storageBackend } from "@/lib/suppliers/store";

export const dynamic = "force-dynamic";

export default async function FournisseursPage() {
  const suppliers = await listSuppliers();

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-caps text-green">
              Espace admin
            </div>
            <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight">Fournisseurs</h1>
          </div>
          <Link
            href="/admin/fournisseurs/nouveau"
            className="flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark"
          >
            <Plus size={16} aria-hidden />
            Nouveau fournisseur
          </Link>
        </div>

        {storageBackend() === "memory" && (
          <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
            <strong className="font-bold">Stockage temporaire actif.</strong> Sans base de données,
            les fournisseurs sont en mémoire et perdus au redéploiement.
          </div>
        )}

        <div className="mt-8">
          <SuppliersTable suppliers={suppliers} />
        </div>
      </main>
    </>
  );
}

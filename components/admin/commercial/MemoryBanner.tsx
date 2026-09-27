import { storageBackend } from "@/lib/billing/store";

/** Bandeau d'avertissement quand aucune base n'est configurée (données en mémoire). */
export function MemoryBanner() {
  if (storageBackend() !== "memory") return null;
  return (
    <div className="mt-6 rounded-2xl border border-green/30 bg-green-soft px-5 py-4 text-[13px] leading-[1.6] text-green-dark">
      <strong className="font-bold">Stockage temporaire actif.</strong> Sans base de données (variable{" "}
      <code className="rounded bg-white/60 px-1">DATABASE_URL</code>), les documents sont en mémoire et perdus au redémarrage.
    </div>
  );
}

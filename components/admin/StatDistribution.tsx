import { cn } from "@/lib/cn";

export interface DistributionSegment {
  label: string;
  value: number;
  /** Classe Tailwind de remplissage (ex. "bg-green"). */
  colorClass: string;
  /** Texte secondaire optionnel affiché dans la légende (ex. un montant). */
  hint?: string;
}

/**
 * Répartition d'un total en segments : barre empilée + légende chiffrée.
 * Générique — sert aux factures par statut comme aux commandes par étape.
 */
export function StatDistribution({ segments }: { segments: DistributionSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-pill bg-paper">
        {total === 0 ? (
          <div className="h-full w-full bg-line" />
        ) : (
          segments.map((seg) =>
            seg.value > 0 ? (
              <div
                key={seg.label}
                className={cn("h-full", seg.colorClass)}
                style={{ width: `${(seg.value / total) * 100}%` }}
                title={`${seg.label} : ${seg.value}`}
              />
            ) : null,
          )
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <li key={seg.label} className="flex items-center gap-2.5 text-[13px]">
              <span className={cn("h-2.5 w-2.5 flex-none rounded-full", seg.colorClass)} aria-hidden />
              <span className="text-slate">{seg.label}</span>
              {seg.hint && <span className="text-[11.5px] text-ash">{seg.hint}</span>}
              <span className="ml-auto flex items-center gap-2 tabular-nums">
                <span className="font-semibold text-ink">{seg.value}</span>
                <span className="w-9 text-right text-[11.5px] text-ash">{pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { cn } from "@/lib/cn";

/**
 * Motifs gréco-romains tuilés, en ton sur ton — répertoire d'Héphaïstos et de
 * l'architecture antique. La couleur vient de `currentColor` : on règle la
 * teinte et l'opacité via une classe utilitaire (ex. `text-ink/[0.05]`).
 *
 * - meander : méandre grec (grecque), bande à fret
 * - scales  : écailles / tuiles antiques (imbrications)
 * - columns : colonnade, cannelures à arcs
 * - wave    : vague grecque (rinceau vitruvien)
 */
export type MythVariant = "meander" | "scales" | "columns" | "wave";

const TILES: Record<
  MythVariant,
  { w: number; h: number; strokeWidth: number; paths: string[] }
> = {
  meander: {
    w: 64,
    h: 64,
    strokeWidth: 2,
    paths: ["M0 58 H64", "M10 58 V14 H54 V46 H26 V34 H42"],
  },
  scales: {
    w: 48,
    h: 48,
    strokeWidth: 1.5,
    paths: [
      "M0 24 A24 24 0 0 1 48 24",
      "M-24 48 A24 24 0 0 1 24 48",
      "M24 48 A24 24 0 0 1 72 48",
    ],
  },
  columns: {
    w: 40,
    h: 120,
    strokeWidth: 1.5,
    paths: ["M10 120 V40 A10 10 0 0 1 30 40 V120", "M0 112 H40"],
  },
  wave: {
    w: 64,
    h: 40,
    strokeWidth: 1.5,
    paths: ["M0 28 C 8 28, 8 12, 16 12 S 24 28, 32 28 S 40 12, 48 12 S 56 28, 64 28"],
  },
};

export function MythPattern({
  variant,
  className,
  id,
}: {
  variant: MythVariant;
  className?: string;
  /** À préciser si le même motif apparaît deux fois sur une page. */
  id?: string;
}) {
  const tile = TILES[variant];
  const patternId = id ?? `myth-${variant}`;

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <pattern id={patternId} width={tile.w} height={tile.h} patternUnits="userSpaceOnUse">
          {tile.paths.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={tile.strokeWidth}
              strokeLinecap="square"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

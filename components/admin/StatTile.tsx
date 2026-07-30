import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Carte d'indicateur réutilisable (dashboard, stats…). */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "green" | "warn";
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-white px-5 py-4 shadow-card transition-shadow",
        href && "hover:shadow-card-hover",
        tone === "warn" ? "border-danger/25" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-caps text-ash">{label}</span>
        {Icon && (
          <Icon
            size={18}
            strokeWidth={1.8}
            aria-hidden
            className={cn(
              "flex-none",
              tone === "green" ? "text-green" : tone === "warn" ? "text-danger" : "text-ash",
            )}
          />
        )}
      </div>
      <div
        className={cn(
          "mt-2 text-[26px] font-extrabold tabular-nums",
          tone === "green" && "text-green",
          tone === "warn" && "text-danger",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[12px] text-ash">{sub}</div>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

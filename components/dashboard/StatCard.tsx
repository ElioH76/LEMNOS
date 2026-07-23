import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-6 py-6 transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-caps text-ash">{label}</span>
        <Icon size={20} strokeWidth={1.8} aria-hidden className="flex-none text-green" />
      </div>
      <div className="mt-3 text-stat font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

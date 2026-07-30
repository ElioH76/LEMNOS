import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * En-tête de section : libellé + filet horizontal, pour délimiter clairement
 * les blocs d'une page (indicateurs, graphiques…). Icône optionnelle.
 */
export function SectionHeading({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", className)}>
      <h2 className="inline-flex items-center gap-2 rounded-md bg-green px-3 py-1.5 text-[12px] font-bold uppercase tracking-caps text-white">
        {Icon && <Icon size={14} strokeWidth={2.2} className="flex-none" aria-hidden />}
        {children}
      </h2>
      <span className="h-px flex-1 bg-line" aria-hidden />
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Carte blanche bordée, angles nets de la nouvelle DA. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white", className)}>{children}</div>
  );
}

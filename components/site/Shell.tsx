import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Conteneur centré 1280px, gouttières 20px (mobile) → 56px (desktop). */
export function Shell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-14", className)}>{children}</div>;
}

/** Surtitre du site public : capitales vert clair sur fond nuit. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("block text-[13px] font-bold uppercase tracking-brand text-mint", className)}>
      {children}
    </span>
  );
}

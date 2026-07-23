import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Conteneur centré 1200px, gouttières responsives. */
export function Shell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-shell px-6 md:px-10", className)}>{children}</div>;
}

/** Surtitre label : vert sur fond clair, vert clair sur fond sombre. */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-label font-semibold uppercase",
        tone === "dark" ? "text-green-light" : "text-green",
        className,
      )}
    >
      {children}
    </div>
  );
}

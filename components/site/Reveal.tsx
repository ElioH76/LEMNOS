import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Animation d'entrée (fondu + montée de 16px, spec motion de la DA), 100 % CSS
 * via la classe `.reveal-in` — jouée au chargement, sans JS ni observer, donc
 * jamais de contenu masqué si un script échoue. Désactivée sous
 * prefers-reduced-motion (voir globals.css). `delay` échelonne les groupes.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  return (
    <Tag className={cn("reveal-in", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

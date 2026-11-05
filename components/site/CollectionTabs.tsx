"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Onglets entre les collections du club partenaire. Tous les panneaux sont
 * rendus côté serveur (contenu et images indexables) ; l'onglet inactif est
 * simplement masqué via `hidden`. Flèches gauche / droite pour naviguer.
 */
export function CollectionTabs({
  tabs,
  panels,
}: {
  tabs: { id: string; label: string; isNew?: boolean }[];
  panels: ReactNode[];
}) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    buttons.current[next]?.focus();
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Collections"
        onKeyDown={onKeyDown}
        className="inline-flex rounded-pill border border-line-dark bg-surface-dark/60 p-1"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`collection-tab-${tab.id}`}
            aria-selected={active === i}
            aria-controls={`collection-panel-${tab.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-center gap-2 rounded-pill px-5 py-2 text-[13px] font-bold tracking-tight transition-colors duration-200",
              active === i ? "bg-white text-ink" : "text-fog hover:text-white",
            )}
          >
            {tab.label}
            {tab.isNew ? (
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-label",
                  active === i ? "bg-green text-white" : "bg-green/20 text-green-light",
                )}
              >
                Nouveau
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {panels.map((panel, i) => (
        <div
          key={tabs[i].id}
          role="tabpanel"
          id={`collection-panel-${tabs[i].id}`}
          aria-labelledby={`collection-tab-${tabs[i].id}`}
          hidden={active !== i}
        >
          {panel}
        </div>
      ))}
    </>
  );
}

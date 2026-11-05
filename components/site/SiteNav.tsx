"use client";

import { useEffect, useState } from "react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { cn } from "@/lib/cn";
import { Shell } from "./Shell";

/**
 * Barre du site public : logo + un seul appel à l'action. Transparente sur le
 * hero, fond nuit dès qu'on défile.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 text-white transition-colors duration-300",
        scrolled ? "border-b border-night-line bg-ink-deep/90 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <Shell className={cn("flex items-center justify-between transition-[padding] duration-300", scrolled ? "py-4" : "py-5 md:py-7")}>
        <a href="/" aria-label="Lemnos — accueil" className="text-white">
          <LogoLockup
            markClassName="w-[24px] md:w-[28px] text-white"
            wordmarkClassName="text-[17px] md:text-[20px]"
            className="gap-2.5"
          />
        </a>

        <a
          href="/#demande"
          className="rounded-sharp border-[1.5px] border-white px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white hover:text-ink-deep md:px-5 md:py-[11px] md:text-[14px]"
        >
          Demander mon maillot
        </a>
      </Shell>
    </nav>
  );
}

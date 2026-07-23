"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { cn } from "@/lib/cn";
import { navLinks } from "@/lib/site-content";
import { Shell } from "./Shell";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        scrolled ? "bg-ink/95 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <Shell className="flex items-center justify-between py-6">
        <a href="#top" aria-label="Lemnos — accueil" className="text-white hover:text-white">
          <LogoLockup markClassName="w-[30px] text-white" wordmarkClassName="text-[19px]" />
        </a>

        <div className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="link-underline text-[13px] font-medium tracking-link text-haze transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#projet"
            className="rounded-sharp bg-green px-5 py-[11px] text-[12.5px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark hover:text-white"
          >
            Démarrer
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="-mr-1 p-2 text-white lg:hidden"
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </Shell>

      <div
        className={cn(
          "overflow-hidden bg-ink/95 backdrop-blur-md transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <Shell className="flex flex-col gap-1 pb-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 text-[15px] font-medium text-haze transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#projet"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-sharp bg-green px-5 py-3 text-center text-[13px] font-semibold uppercase tracking-caps text-white"
          >
            Démarrer
          </a>
        </Shell>
      </div>
    </nav>
  );
}

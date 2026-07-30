"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { AdminSidebar } from "./AdminSidebar";

/**
 * Ossature de l'admin : sidebar latérale fixe à gauche (≥ md), barre + tiroir
 * sur mobile. La page de connexion (`/admin/login`) est rendue seule, sans
 * ossature. L'état actif de la nav est dérivé de l'URL dans `AdminSidebar`.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Referme le tiroir à chaque changement de route.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar fixe — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 md:block">
        <AdminSidebar />
      </aside>

      {/* Barre supérieure — mobile */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/admin" aria-label="Espace admin Lemnos">
          <LogoLockup markClassName="w-[22px] text-green" wordmarkClassName="text-[16px]" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-md p-2 text-slate transition-colors hover:bg-paper hover:text-ink"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Tiroir — mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-immersive">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-slate transition-colors hover:bg-paper hover:text-ink"
            >
              <X size={18} />
            </button>
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="md:pl-60">{children}</div>
    </div>
  );
}

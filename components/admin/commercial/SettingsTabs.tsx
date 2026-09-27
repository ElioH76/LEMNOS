"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/parametres/entreprise", label: "Entreprise" },
  { href: "/admin/parametres/paiement", label: "Paiement" },
  { href: "/admin/parametres/conditions", label: "Conditions" },
  { href: "/admin/parametres/numerotation", label: "Numérotation" },
  { href: "/admin/parametres/emails", label: "Emails" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Paramètres">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors",
                  active ? "border-green text-green" : "border-transparent text-ash hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}
interface NavGroup {
  label?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    items: [{ label: "Tableau de bord", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Commercial",
    items: [
      { label: "Demandes", href: "/admin/demandes", icon: Inbox },
      { label: "Clients", href: "/admin/clients", icon: Users },
      { label: "Commandes", href: "/admin/commandes", icon: Package },
      { label: "Factures", href: "/admin/factures", icon: FileText },
    ],
  },
  {
    label: "Production",
    items: [
      { label: "Médiathèque", href: "/admin/mediatheque", icon: ImageIcon },
      { label: "Fournisseurs", href: "/admin/fournisseurs", icon: Truck },
    ],
  },
  {
    label: "Pilotage",
    items: [{ label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 }],
  },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-green to-green-dark text-white">
      <div className="flex h-16 flex-none items-center border-b border-white/10 px-5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir le site lemnos.fr dans un nouvel onglet"
          className="transition-opacity hover:opacity-80"
        >
          <LogoLockup markClassName="w-[24px] text-white" wordmarkClassName="text-[17px] text-white" />
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {GROUPS.map((group, i) => (
          <div key={group.label ?? i} className={cn(i > 0 && "mt-6")}>
            {group.label && (
              <div className="mb-2 flex items-center gap-2.5 px-3">
                <span className="text-[11px] font-bold uppercase tracking-caps text-white/65">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-white/20" aria-hidden />
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-semibold transition-colors",
                        active
                          ? "bg-white text-green shadow-sm"
                          : "text-white/75 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon size={16} strokeWidth={2} aria-hidden className="flex-none" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex-none border-t border-white/15 p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden className="flex-none" />
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}

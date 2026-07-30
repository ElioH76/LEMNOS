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
    <div className="flex h-full flex-col border-r border-line bg-white">
      <div className="flex h-16 flex-none items-center px-5">
        <Link href="/admin" onClick={onNavigate} aria-label="Espace admin Lemnos">
          <LogoLockup markClassName="w-[24px] text-green" wordmarkClassName="text-[17px]" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {GROUPS.map((group, i) => (
          <div key={group.label ?? i} className={cn(i > 0 && "mt-5")}>
            {group.label && (
              <div className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-caps text-ash">
                {group.label}
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
                          ? "bg-ink text-white"
                          : "text-slate hover:bg-paper hover:text-ink",
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

      <div className="flex-none border-t border-line p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-semibold text-slate transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden className="flex-none" />
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}

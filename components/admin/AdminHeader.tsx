import { FileText, Inbox, LayoutDashboard, LogOut, Package, Users } from "lucide-react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

type Section = "dashboard" | "demandes" | "clients" | "commandes" | "factures";

const NAV: { key: Section; label: string; href: string; icon: typeof Inbox }[] = [
  { key: "dashboard", label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { key: "demandes", label: "Demandes", href: "/admin/demandes", icon: Inbox },
  { key: "clients", label: "Clients", href: "/admin/clients", icon: Users },
  { key: "commandes", label: "Commandes", href: "/admin/commandes", icon: Package },
  { key: "factures", label: "Factures", href: "/admin/factures", icon: FileText },
];

export function AdminHeader({ active }: { active: Section }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-6">
          <LogoLockup markClassName="w-[24px] text-green" wordmarkClassName="text-[17px]" />
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-sharp px-3 py-2 text-[13px] font-semibold transition-colors",
                    isActive
                      ? "bg-ink text-white"
                      : "text-slate hover:bg-paper hover:text-ink",
                  )}
                >
                  <Icon size={15} aria-hidden />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-sharp border border-line px-3.5 py-2 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green"
          >
            <LogOut size={15} aria-hidden />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </form>
      </div>
    </header>
  );
}

"use client";

import {
  Folder,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shirt,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavIconKey, NavItem } from "@/lib/mock-data";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  overview: LayoutDashboard,
  projects: Folder,
  prototypes: Shirt,
  orders: ShoppingBag,
  messages: MessageSquare,
  settings: Settings,
};

export function SidebarNav({
  items,
  activeKey,
  onNavigate,
}: {
  items: NavItem[];
  activeKey: NavIconKey;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.key];
        const isActive = item.key === activeKey;

        return (
          <a
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
              isActive
                ? "bg-white/[0.06] text-white"
                : "text-mute-ink hover:bg-white/[0.04] hover:text-white",
            )}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-pill bg-green"
              />
            )}
            <Icon size={18} strokeWidth={1.8} className="flex-none" aria-hidden />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-pill bg-green px-2 py-0.5 text-[11px] font-semibold text-white">
                {item.badge}
              </span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}

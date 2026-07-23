"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SidebarBody } from "./SidebarBody";
import type { Account } from "@/lib/types";
import type { NavIconKey, NavItem } from "@/lib/mock-data";

export function MobileDrawer({
  open,
  onClose,
  account,
  nav,
  activeKey,
}: {
  open: boolean;
  onClose: () => void;
  account: Account;
  nav: NavItem[];
  activeKey: NavIconKey;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={cn("lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-sidebar max-w-[85vw] overflow-y-auto bg-ink text-white transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={onClose}
          aria-label="Fermer la navigation"
          className="absolute right-4 top-6 rounded-lg p-1.5 text-mute-ink transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} aria-hidden />
        </button>
        <SidebarBody account={account} nav={nav} activeKey={activeKey} onNavigate={onClose} />
      </div>
    </div>
  );
}

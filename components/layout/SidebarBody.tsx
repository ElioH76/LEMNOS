"use client";

import { LogoLockup } from "@/components/brand/LogoLockup";
import { SidebarNav } from "./SidebarNav";
import type { Account } from "@/lib/types";
import type { NavIconKey, NavItem } from "@/lib/mock-data";

/** Contenu commun à la sidebar desktop et au drawer mobile. */
export function SidebarBody({
  account,
  nav,
  activeKey,
  onNavigate,
}: {
  account: Account;
  nav: NavItem[];
  activeKey: NavIconKey;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col px-5 py-7">
      <div className="px-2 pb-8">
        <LogoLockup markClassName="w-[26px] text-white" wordmarkClassName="text-[18px]" />
      </div>
      <SidebarNav items={nav} activeKey={activeKey} onNavigate={onNavigate} />

      <div className="mt-auto flex items-center gap-3 border-t border-line-dark pt-5">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-white/[0.06] text-[14px] font-bold text-green-light">
          {account.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-white">{account.name}</div>
          <div className="text-[11px] text-mute-ink">{account.meta}</div>
        </div>
      </div>
    </div>
  );
}

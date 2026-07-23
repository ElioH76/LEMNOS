"use client";

import { useState, type ReactNode } from "react";
import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Account } from "@/lib/types";
import type { NavIconKey, NavItem } from "@/lib/mock-data";

export function AppShell({
  account,
  nav,
  activeKey,
  children,
}: {
  account: Account;
  nav: NavItem[];
  activeKey: NavIconKey;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar account={account} nav={nav} activeKey={activeKey} />
      <MobileDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        account={account}
        nav={nav}
        activeKey={activeKey}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-paper">
        <TopBar account={account} onOpenNav={() => setNavOpen(true)} />
        <main className="px-5 pb-12 pt-8 md:px-9">{children}</main>
      </div>
    </div>
  );
}

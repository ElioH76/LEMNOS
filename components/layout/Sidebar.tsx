"use client";

import { SidebarBody } from "./SidebarBody";
import type { Account } from "@/lib/types";
import type { NavIconKey, NavItem } from "@/lib/mock-data";

/** Sidebar fixe à partir de lg. En dessous, c'est le <MobileDrawer>. */
export function Sidebar({
  account,
  nav,
  activeKey,
}: {
  account: Account;
  nav: NavItem[];
  activeKey: NavIconKey;
}) {
  return (
    <aside className="hidden w-sidebar flex-none bg-ink text-white lg:block">
      <div className="sticky top-0 h-screen overflow-y-auto">
        <SidebarBody account={account} nav={nav} activeKey={activeKey} />
      </div>
    </aside>
  );
}

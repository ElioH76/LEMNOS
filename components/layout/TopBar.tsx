"use client";

import { Menu, Search } from "lucide-react";
import type { Account } from "@/lib/types";

export function TopBar({ account, onOpenNav }: { account: Account; onOpenNav: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-6 border-b border-line bg-white/90 px-5 py-4 backdrop-blur-md md:px-9">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNav}
          aria-label="Ouvrir la navigation"
          className="-ml-1 rounded-lg p-2 text-ink transition-colors hover:bg-paper lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-caps text-ash">
            Vue d&apos;ensemble
          </div>
          <h1 className="mt-0.5 text-[20px] font-extrabold tracking-tight sm:text-[24px]">
            Bonjour, {account.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="hidden w-[230px] items-center gap-2.5 rounded-field border-[1.5px] border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-green xl:flex">
          <Search size={16} className="flex-none text-ash" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ash"
          />
        </label>
        <button className="flex-none whitespace-nowrap rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark sm:px-[18px]">
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">Nouveau projet</span>
        </button>
      </div>
    </header>
  );
}

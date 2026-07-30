"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MEDIA_KINDS, MEDIA_KIND_LABEL, type MediaAsset, type MediaKind } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { MediaCard } from "./MediaCard";

type KindFilter = "tous" | MediaKind;

export function MediaGrid({ assets }: { assets: MediaAsset[] }) {
  const [kind, setKind] = useState<KindFilter>("tous");
  const [client, setClient] = useState("tous");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const base = { tous: assets.length } as Record<KindFilter, number>;
    for (const k of MEDIA_KINDS) base[k] = 0;
    for (const a of assets) base[a.kind] += 1;
    return base;
  }, [assets]);

  const clients = useMemo(
    () => Array.from(new Set(assets.map((a) => a.clientName).filter(Boolean))).sort(),
    [assets],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (kind !== "tous" && a.kind !== kind) return false;
      if (client !== "tous" && a.clientName !== client) return false;
      if (q && !`${a.title} ${a.filename} ${a.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, kind, client, search]);

  const tabs: KindFilter[] = ["tous", ...MEDIA_KINDS];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setKind(tab)}
            className={cn(
              "rounded-pill px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
              kind === tab
                ? "bg-ink text-white"
                : "border border-line bg-white text-slate hover:border-green hover:text-green",
            )}
          >
            {tab === "tous" ? "Tous" : MEDIA_KIND_LABEL[tab]}
            <span className={cn("ml-1.5 tabular-nums", kind === tab ? "text-white/70" : "text-ash")}>
              {counts[tab]}
            </span>
          </button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {clients.length > 0 && (
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="max-w-[180px] rounded-field border-[1.5px] border-line bg-white px-3 py-2 text-[13px]"
            >
              <option value="tous">Tous les clients</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 rounded-field border-[1.5px] border-line bg-white px-3 py-2 focus-within:border-green">
            <Search size={15} className="text-ash" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-32 bg-transparent text-[13px] outline-none placeholder:text-ash"
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-[14px] text-ash">
          Aucun média {kind === "tous" ? "pour l'instant" : `« ${MEDIA_KIND_LABEL[kind]} »`}.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <MediaCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

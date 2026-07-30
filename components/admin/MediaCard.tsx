"use client";

import { type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { deleteMediaAssetAction } from "@/app/actions/media";
import { blobDisplaySrc } from "@/lib/blob/url";
import { formatBytes, type MediaAsset } from "@/lib/media/types";
import { MediaKindBadge } from "./MediaKindBadge";
import { MediaThumb } from "./MediaThumb";

function frDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export function MediaCard({ asset, showClient = true }: { asset: MediaAsset; showClient?: boolean }) {
  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer « ${asset.title || asset.filename} » ? Le fichier sera effacé.`))
      e.preventDefault();
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-card">
      <a
        href={blobDisplaySrc(asset.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-square overflow-hidden bg-paper"
        title="Ouvrir le fichier"
      >
        <MediaThumb url={asset.url} contentType={asset.contentType} />
        <span className="absolute left-2 top-2">
          <MediaKindBadge kind={asset.kind} />
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="truncate text-[13px] font-semibold" title={asset.title || asset.filename}>
          {asset.title || asset.filename}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ash">
          {showClient && asset.clientName && <span className="truncate">{asset.clientName}</span>}
          {showClient && asset.clientName && <span aria-hidden>·</span>}
          <span className="tabular-nums">{formatBytes(asset.size)}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{frDate(asset.createdAt)}</span>
        </div>

        {asset.notes && (
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-[1.5] text-slate">{asset.notes}</p>
        )}

        <form action={deleteMediaAssetAction} onSubmit={confirmDelete} className="mt-2 flex justify-end">
          <input type="hidden" name="id" value={asset.id} />
          <button
            type="submit"
            aria-label="Supprimer le média"
            className="flex items-center gap-1.5 rounded-sharp px-2 py-1 text-[11.5px] font-semibold text-ash opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
          >
            <Trash2 size={13} aria-hidden />
            Supprimer
          </button>
        </form>
      </div>
    </div>
  );
}

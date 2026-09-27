"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Lock, X } from "lucide-react";
import { createMediaAssetAction } from "@/app/actions/media";
import { blobDisplaySrc } from "@/lib/blob/url";
import { cn } from "@/lib/cn";
import { Section } from "./ui";

/** Média image proposé au choix (médiathèque). */
export interface MediaOption {
  id: string;
  url: string;
  title: string;
  contentType: string;
  kind: string;
  clientId: string | null;
  clientName: string;
}

/** Visuel sélectionné dans le formulaire (envoyé au serveur par id / mediaId). */
export interface VisualChoice {
  /** Id d'un visuel déjà présent sur le document (copie figée). */
  id?: string;
  mediaId: string | null;
  url: string;
  title: string;
}

const MAX = 8;

/**
 * Choix des visuels (designs de maillots…) joints au document, pris dans la
 * médiathèque du client ou téléversés à la volée. Ils forment l'annexe
 * « Visuels du projet » du PDF.
 */
export function VisualsPicker({
  media,
  setMedia,
  clientId,
  clientName,
  value,
  onChange,
  show,
  onShowChange,
  locked,
  blobEnabled,
}: {
  media: MediaOption[];
  setMedia: (fn: (m: MediaOption[]) => MediaOption[]) => void;
  clientId: string;
  clientName: string;
  value: VisualChoice[];
  onChange: (v: VisualChoice[]) => void;
  show: boolean;
  onShowChange: (v: boolean) => void;
  locked: boolean;
  blobEnabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const name = clientName.trim().toLowerCase();
  const ofClient = media.filter(
    (m) => (clientId && m.clientId === clientId) || (!m.clientId && name && m.clientName.trim().toLowerCase() === name),
  );
  const candidates = [...(showAll ? media : ofClient)].sort((a, b) => Number(b.kind === "design") - Number(a.kind === "design"));
  const selectedIds = new Set(value.map((v) => v.mediaId).filter(Boolean));

  const toggle = (m: MediaOption) => {
    if (selectedIds.has(m.id)) onChange(value.filter((v) => v.mediaId !== m.id));
    else if (value.length < MAX) onChange([...value, { mediaId: m.id, url: m.url, title: m.title }]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const added: VisualChoice[] = [];
    for (const file of Array.from(files).slice(0, MAX - value.length)) {
      try {
        const blob = await upload(file.name, file, { access: "private", handleUploadUrl: "/api/blob/upload" });
        const title = file.name.replace(/\.[a-z0-9]+$/i, "");
        const contentType = file.type || blob.contentType || "image/png";
        const res = await createMediaAssetAction({
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          contentType,
          size: file.size,
          kind: "design",
          title,
          clientId: clientId || null,
          clientName,
          orderId: null,
          notes: "",
        });
        if (!res.ok || !res.id) throw new Error(res.error);
        const option: MediaOption = { id: res.id, url: blob.url, title, contentType, kind: "design", clientId: clientId || null, clientName };
        setMedia((m) => [option, ...m]);
        added.push({ mediaId: res.id, url: blob.url, title });
      } catch {
        setError(`Téléversement impossible pour « ${file.name} ».`);
      }
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Section
      title="Visuels du projet"
      action={
        <label className="flex items-center gap-2 text-[12.5px] font-semibold text-slate">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} className="h-4 w-4 accent-[#1E5B3C]" />
          Afficher sur le PDF
        </label>
      }
    >
      <p className="mb-4 text-[12.5px] text-ash">
        Les visuels choisis forment une page d&apos;annexe « Visuels du projet » à la fin du PDF, et sont repris sur les factures
        issues du devis.
      </p>

      {/* Sélection (ordre d'affichage) */}
      {value.length > 0 && (
        <ol className="mb-4 flex flex-col gap-2">
          {value.map((v, i) => (
            <li key={v.id ?? v.mediaId ?? i} className="flex items-center gap-3 rounded-xl border border-line bg-paper/40 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blobDisplaySrc(v.url)} alt="" className="h-14 w-14 flex-none rounded-md border border-line bg-white object-contain" />
              <input
                value={v.title}
                disabled={locked}
                onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))}
                className="min-w-0 flex-1 rounded-field border-[1.5px] border-line bg-white px-2.5 py-2 text-[13px] outline-none focus:border-green disabled:bg-paper"
                aria-label="Légende du visuel"
              />
              {!locked && (
                <div className="flex flex-none items-center">
                  <IconBtn title="Monter" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp size={14} />
                  </IconBtn>
                  <IconBtn title="Descendre" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                    <ArrowDown size={14} />
                  </IconBtn>
                  <IconBtn title="Retirer" onClick={() => onChange(value.filter((_, k) => k !== i))}>
                    <X size={14} />
                  </IconBtn>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {locked ? (
        <p className="flex items-center gap-2 text-[12.5px] text-ash">
          <Lock size={13} /> Visuels repris du devis. Vous pouvez seulement choisir de les afficher ou non.
        </p>
      ) : (
        <>
          {candidates.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {candidates.map((m) => {
                const on = selectedIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m)}
                    title={m.title}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition-colors",
                      on ? "border-green" : "border-line hover:border-green/50",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={blobDisplaySrc(m.url)} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
                    {on && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green text-white">
                        <Check size={12} />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-white/90 px-1.5 py-0.5 text-[10.5px] text-slate">{m.title}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-paper/70 px-4 py-3 text-[13px] text-ash">
              {clientId ? "Aucun visuel pour ce client dans la médiathèque." : "Choisissez d'abord un client."}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {blobEnabled ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                  multiple
                  hidden
                  onChange={(e) => onFiles(e.target.files)}
                />
                <button
                  type="button"
                  disabled={busy || value.length >= MAX}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-sharp border border-dashed border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} Téléverser un design
                </button>
              </>
            ) : (
              <span className="text-[12px] text-ash">Stockage Blob non configuré : téléversement indisponible.</span>
            )}
            {media.length > ofClient.length && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[12.5px] font-semibold text-green hover:underline">
                {showAll ? "Voir seulement ce client" : "Voir toute la médiathèque"}
              </button>
            )}
            <span className="ml-auto text-[12px] text-ash">
              {value.length}/{MAX}
            </span>
          </div>
          {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
        </>
      )}
    </Section>
  );
}

function IconBtn({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-sharp text-ash transition-colors hover:bg-white hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}

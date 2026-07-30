"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { createMediaAssetAction } from "@/app/actions/media";
import { MEDIA_KINDS, MEDIA_KIND_LABEL, type MediaKind } from "@/lib/media/types";
import { cn } from "@/lib/cn";

export interface ClientOption {
  id: string;
  club: string;
}

interface Item {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/avif,application/pdf";
const FIELD =
  "rounded-field border-[1.5px] border-line bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-green";

/**
 * Téléversement multi-fichiers vers Blob (privé) puis enregistrement du média.
 * Réutilisable : médiathèque (avec sélecteur client), fiche client ou commande
 * (client/commande figés via `fixed*`).
 */
export function MediaUploader({
  clients = [],
  fixedClientId,
  fixedClientName,
  fixedOrderId,
  defaultKind = "design",
}: {
  clients?: ClientOption[];
  fixedClientId?: string;
  fixedClientName?: string;
  fixedOrderId?: string;
  defaultKind?: MediaKind;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<MediaKind>(defaultKind);
  const [clientId, setClientId] = useState<string>(fixedClientId ?? "");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  // Sur une fiche client ou une commande, le client est implicite → pas de sélecteur.
  const clientFixed = Boolean(fixedClientId || fixedOrderId);

  const resolveClientName = (): string => {
    if (clientFixed) return fixedClientName ?? "";
    return clients.find((c) => c.id === clientId)?.club ?? "";
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setBusy(true);
    setItems(list.map((f) => ({ name: f.name, status: "uploading" as const })));

    const clientName = resolveClientName();
    const linkedClientId = fixedClientId ?? (clientId || null);

    await Promise.all(
      list.map(async (file, index) => {
        try {
          const blob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/blob/upload",
          });
          const res = await createMediaAssetAction({
            url: blob.url,
            pathname: blob.pathname,
            filename: file.name,
            contentType: file.type || blob.contentType || "application/octet-stream",
            size: file.size,
            kind,
            title: "",
            clientId: linkedClientId,
            clientName,
            orderId: fixedOrderId ?? null,
            notes: "",
          });
          setItems((prev) =>
            prev.map((it, i) =>
              i === index ? { ...it, status: res.ok ? "done" : "error", error: res.error } : it,
            ),
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it, i) =>
              i === index ? { ...it, status: "error", error: (err as Error).message } : it,
            ),
          );
        }
      }),
    );

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-caps text-ash">Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as MediaKind)} className={FIELD}>
            {MEDIA_KINDS.map((k) => (
              <option key={k} value={k}>
                {MEDIA_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>

        {!clientFixed && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-caps text-ash">Client</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={cn(FIELD, "max-w-[200px]")}>
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.club}
                </option>
              ))}
            </select>
          </label>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {busy ? "Téléversement…" : "Ajouter des fichiers"}
        </button>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-line-soft pt-3">
          {items.map((it, i) => (
            <li key={`${it.name}-${i}`} className="flex items-center gap-2 text-[12.5px]">
              {it.status === "uploading" && <Loader2 size={13} className="animate-spin text-ash" />}
              {it.status === "done" && <CheckCircle2 size={13} className="text-green" />}
              {it.status === "error" && <XCircle size={13} className="text-danger" />}
              <span className="truncate text-slate">{it.name}</span>
              {it.error && <span className="text-[11px] text-danger">{it.error}</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-ash">
        Images (PNG, JPG, WebP, SVG) ou PDF — 10 Mo max. Plusieurs fichiers possibles.
      </p>
    </div>
  );
}

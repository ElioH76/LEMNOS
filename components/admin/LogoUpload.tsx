"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImageUp, Link2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { blobDisplaySrc } from "@/lib/blob/url";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|avif|svg)(\?|$)/i.test(url);
}

/**
 * Champ d'image (logo, plus tard designs). Avec Vercel Blob activé : téléversement
 * direct navigateur → Blob via /api/blob/upload, aperçu, suppression. Sans Blob :
 * repli sur une saisie d'URL manuelle (comportement historique), pour que le
 * formulaire reste pleinement utilisable.
 */
export function LogoUpload({
  value,
  onChange,
  blobEnabled,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/avif",
}: {
  value: string;
  onChange: (url: string) => void;
  blobEnabled: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/blob/upload",
      });
      onChange(blob.url);
    } catch (err) {
      setError((err as Error).message || "Téléversement impossible.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {value && (
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-field border border-line bg-paper">
            {isImageUrl(value) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={blobDisplaySrc(value)} alt="Aperçu du logo" className="h-full w-full object-contain" />
            ) : (
              <Link2 size={18} className="text-ash" aria-hidden />
            )}
          </span>
          <a
            href={blobDisplaySrc(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-[12.5px] text-green hover:underline"
          >
            {value}
          </a>
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex-none rounded-sharp p-1.5 text-ash transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label="Retirer le logo"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {blobEnabled ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => onFile(e.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className={cn(
              "inline-flex items-center gap-2 rounded-sharp border border-line px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:opacity-60",
            )}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ImageUp size={15} />}
            {busy ? "Téléversement…" : value ? "Remplacer le fichier" : "Téléverser un fichier"}
          </button>
          <p className="mt-1.5 text-[11.5px] text-ash">PNG, JPG, WebP, SVG ou PDF — 10 Mo max.</p>
        </div>
      ) : (
        <div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className={FIELD}
          />
          <p className="mt-1.5 text-[11.5px] text-ash">
            Collez une URL. Activez Vercel Blob pour téléverser directement un fichier.
          </p>
        </div>
      )}

      {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}

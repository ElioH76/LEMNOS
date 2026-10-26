"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { LABEL } from "./ui";

export function ExportDialog({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (opts: { transparent: boolean; club: string }) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [transparent, setTransparent] = useState(false);
  const [club, setClub] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onExport({ transparent, club: club.trim().slice(0, 60) });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Export impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-2xl p-0 text-ink shadow-immersive backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 rounded-sharp p-2 text-stone hover:bg-paper hover:text-ink">
          <X size={18} aria-hidden />
        </button>
        <div className="text-label font-semibold uppercase text-green">Export visuel</div>
        <h2 className="mt-2 text-[20px] font-bold tracking-tight">Planche face + dos</h2>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-stone">Rendu réel du configurateur, 2 × 1400 px, au format PNG.</p>

        <div className={cn(LABEL, "mt-5")}>Fond</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { v: false, label: "Neutre" },
            { v: true, label: "Transparent" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={transparent === o.v}
              onClick={() => setTransparent(o.v)}
              className={cn(
                "rounded-lg border-[1.5px] px-3 py-2.5 text-[13px] font-semibold transition-colors",
                transparent === o.v ? "border-green bg-green-soft/50 text-green" : "border-line text-slate hover:border-stone",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className={LABEL}>Nom du club (légende)</span>
          <input
            value={club}
            onChange={(e) => setClub(e.target.value)}
            maxLength={60}
            className="mt-1.5 w-full rounded-field border-[1.5px] border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-green"
            placeholder="Facultatif"
          />
        </label>
        {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="mt-5 w-full rounded-sharp bg-green px-5 py-3 text-[12.5px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-60"
        >
          {busy ? "Rendu…" : "Télécharger"}
        </button>
      </div>
    </dialog>
  );
}

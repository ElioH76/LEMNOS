"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eraser, PenLine } from "lucide-react";
import { acceptQuoteOnlineAction } from "@/app/actions/public-quote";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green";

/**
 * Formulaire d'acceptation en ligne. La case « Bon pour accord » est
 * obligatoire ; la signature dessinée est une option distincte, présentée
 * comme telle.
 */
export function QuoteAcceptForm({
  token,
  defaults,
  total,
}: {
  token: string;
  defaults: { name: string; role: string; email: string };
  total: string;
}) {
  const router = useRouter();
  const [f, setF] = useState(defaults);
  const [agree, setAgree] = useState(false);
  const [withSignature, setWithSignature] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!withSignature || !canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1A1D1F";
  }, [withSignature]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clear = () => {
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    const signature = withSignature && hasInk ? canvasRef.current!.toDataURL("image/png") : null;
    const res = await acceptQuoteOnlineAction(token, { ...f, agree, signature });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error ?? "Une erreur est survenue.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold">Nom et prénom *</span>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={FIELD} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold">Fonction</span>
          <input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Président, trésorier…" className={FIELD} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[12px] font-semibold">Email *</span>
          <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={FIELD} autoComplete="email" />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl border-[1.5px] border-line p-4 transition-colors has-[:checked]:border-green has-[:checked]:bg-green-soft/50">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-[#1E5B3C]" />
        <span className="text-[13.5px] leading-[1.55]">
          <strong>Bon pour accord.</strong> J&apos;accepte ce devis d&apos;un montant de <strong>{total}</strong> et ses conditions, et je suis
          habilité(e) à engager ma structure.
        </span>
      </label>

      <div className="rounded-xl border border-line p-4">
        <label className="flex items-center gap-2 text-[13.5px] font-semibold">
          <input type="checkbox" checked={withSignature} onChange={(e) => setWithSignature(e.target.checked)} className="h-4 w-4 accent-[#1E5B3C]" />
          <PenLine size={15} className="text-green" /> Ajouter ma signature manuscrite (facultatif)
        </label>
        <p className="mt-1 text-[12px] text-ash">
          Signature dessinée à l&apos;écran, jointe au devis comme preuve d&apos;accord. Il ne s&apos;agit pas d&apos;une signature
          électronique certifiée.
        </p>
        {withSignature && (
          <div className="mt-3">
            <canvas
              ref={canvasRef}
              className="h-36 w-full touch-none rounded-lg border-[1.5px] border-dashed border-line bg-white"
              onPointerDown={(e) => {
                drawing.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                const ctx = e.currentTarget.getContext("2d")!;
                const p = point(e);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                const ctx = e.currentTarget.getContext("2d")!;
                const p = point(e);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                setHasInk(true);
              }}
              onPointerUp={() => (drawing.current = false)}
              onPointerLeave={() => (drawing.current = false)}
            />
            <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ash hover:text-ink">
              <Eraser size={14} /> Effacer
            </button>
          </div>
        )}
      </div>

      {error && <p className="rounded-field border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy || !agree}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sharp bg-green px-5 py-3.5 text-[14px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <CheckCircle2 size={17} /> {busy ? "Validation…" : "Accepter le devis"}
      </button>
    </div>
  );
}

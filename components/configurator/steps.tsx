"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { ImagePlus, Lock, RefreshCw, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { customLogoRect, LOGO_SCALE_MAX, LOGO_SCALE_MIN } from "@/lib/configurator/layout";
import { UPCOMING_PRODUCTS } from "@/lib/configurator/models";
import type { CustomZone, ProductModel } from "@/lib/configurator/models/types";
import { COLOR_ZONES, NECK_STYLES, PATTERNS, PLAYER_NAME_MAX, TEXT_FONTS } from "@/lib/configurator/options";
import type { ColorZone, DesignConfig, Hex } from "@/lib/configurator/types";
import { TEXT_FONT_FACES } from "./fonts";
import type { DesignAction } from "./state";
import { paintPatternSwatch } from "./three/painters";
import { ACCEPTED_LOGO_TYPES, prepareLogoFile } from "./upload";
import { ColorPicker, LABEL, Note, Slider, Swatch, Toggle } from "./ui";

interface StepProps {
  design: DesignConfig;
  dispatch: Dispatch<DesignAction>;
  model: ProductModel;
}

const LEMNOS_PLACEMENT_LABELS = ["Poitrine (face)", "Haut du dos, sous le col", "Bas du dos (logo complet)"];

// ── 1. Modèle ─────────────────────────────────────────────────────────────
export function StepModel({ model }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border-[1.5px] border-green bg-green-soft/60 p-4">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-white">
          <svg viewBox="0 0 48 48" className="h-8 w-8 text-green" aria-hidden>
            <path
              d="M17 6l-9 5-5 11 7 3 3-6v25h22V19l3 6 7-3-5-11-9-5c-1 4-4 6-7 6s-6-2-7-6z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-ink">{model.name}</div>
          <div className="text-[12px] text-stone">Football · coupe ajustée · col et manches personnalisables</div>
        </div>
      </div>
      {model.demo && (
        <Note>
          Aperçu sur un <strong className="font-semibold text-slate">modèle 3D de démonstration</strong> : volumes,
          couleurs et placements sont fidèles, mais le tombé du tissu sera celui du patron de production.
        </Note>
      )}
      <div>
        <div className={LABEL}>Bientôt</div>
        <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ash">{UPCOMING_PRODUCTS.join(" · ")}</p>
      </div>
    </div>
  );
}

// ── 2. Couleurs ───────────────────────────────────────────────────────────
type ColorTarget = ColorZone | "lemnos";

export function StepColors({ design, dispatch, model }: StepProps) {
  const [target, setTarget] = useState<ColorTarget>("body");
  const zones = COLOR_ZONES.filter((z) => model.colorZones.includes(z.id));
  const disabled: Partial<Record<ColorZone, boolean>> = {
    sidePanels: !design.finish.sidePanels,
    trim: !design.finish.cuffTrim && !design.finish.hemTrim,
    secondary: design.pattern.id === "plain" || design.pattern.id === "tonal",
  };
  const current = target === "lemnos" ? design.lemnosLogoColor : design.colors[target];
  const currentLabel = target === "lemnos" ? "Logos Lemnos" : zones.find((z) => z.id === target)?.label ?? "";

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line">
        {zones.map((z) => (
          <li key={z.id}>
            <button
              type="button"
              onClick={() => setTarget(z.id)}
              aria-pressed={target === z.id}
              className={cn(
                "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                target === z.id ? "bg-green-soft/70" : "hover:bg-paper",
              )}
            >
              <Swatch hex={design.colors[z.id]} className="h-6 w-6 rounded-xs" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-ink">{z.label}</span>
                <span className="block text-[11.5px] text-ash">
                  {z.hint}
                  {disabled[z.id] && " · non visible avec les réglages actuels"}
                </span>
              </span>
              <span className="font-mono text-[11.5px] text-ash">{design.colors[z.id]}</span>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setTarget("lemnos")}
            aria-pressed={target === "lemnos"}
            className={cn(
              "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
              target === "lemnos" ? "bg-green-soft/70" : "hover:bg-paper",
            )}
          >
            <Swatch hex={design.lemnosLogoColor} className="h-6 w-6 rounded-xs" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink">
                Logos Lemnos <Lock size={12} aria-hidden className="text-green" />
              </span>
              <span className="block text-[11.5px] text-ash">Une couleur pour les trois logos</span>
            </span>
            <span className="font-mono text-[11.5px] text-ash">{design.lemnosLogoColor}</span>
          </button>
        </li>
      </ul>

      <div>
        <div className={cn(LABEL, "mb-2.5")}>{currentLabel}</div>
        <ColorPicker
          label={currentLabel}
          value={current}
          onChange={(hex: Hex) =>
            target === "lemnos" ? dispatch({ type: "lemnosColor", hex }) : dispatch({ type: "color", zone: target, hex })
          }
        />
      </div>
    </div>
  );
}

// ── 3. Motifs ─────────────────────────────────────────────────────────────
function PatternThumb({ id, body, secondary }: { id: DesignConfig["pattern"]["id"]; body: string; secondary: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintPatternSwatch(ref.current, id, body, secondary);
  }, [id, body, secondary]);
  return <canvas ref={ref} width={160} height={120} className="block h-full w-full" aria-hidden />;
}

export function StepPatterns({ design, dispatch, model }: StepProps) {
  const patterns = PATTERNS.filter((p) => model.patterns.includes(p.id));
  const usesSecondary = !["plain", "tonal"].includes(design.pattern.id);
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Motif" className="grid grid-cols-3 gap-2">
        {patterns.map((p) => {
          const active = design.pattern.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => dispatch({ type: "pattern", id: p.id })}
              className={cn(
                "group overflow-hidden rounded-lg border-[1.5px] text-left transition-colors",
                active ? "border-green" : "border-line hover:border-stone",
              )}
            >
              <span className="block aspect-[4/3] overflow-hidden">
                <PatternThumb id={p.id} body={design.colors.body} secondary={design.colors.secondary} />
              </span>
              <span className={cn("block px-2 py-1.5 text-[11.5px] font-semibold", active ? "text-green" : "text-slate")}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {design.pattern.id !== "plain" && (
        <Slider
          label="Échelle du motif"
          value={design.pattern.scale}
          min={0.5}
          max={2}
          step={0.05}
          onChange={(scale) => dispatch({ type: "patternScale", scale })}
          format={(v) => `×${v.toFixed(2)}`}
        />
      )}
      {usesSecondary && (
        <div>
          <div className={cn(LABEL, "mb-2.5")}>Couleur du motif</div>
          <ColorPicker
            label="Couleur du motif"
            value={design.colors.secondary}
            onChange={(hex) => dispatch({ type: "color", zone: "secondary", hex })}
          />
        </div>
      )}
      {design.pattern.id === "tonal" && <Note>Ton sur ton : le motif est dérivé automatiquement de la couleur principale.</Note>}
      {design.pattern.id !== "plain" && (
        <Toggle
          label="Prolonger le motif sur les manches"
          checked={design.finish.patternOnSleeves}
          onChange={(patternOnSleeves) => dispatch({ type: "finish", patch: { patternOnSleeves } })}
        />
      )}
    </div>
  );
}

// ── 4. Logos ──────────────────────────────────────────────────────────────
function ZoneCard({ zone, design, dispatch }: { zone: CustomZone; design: DesignConfig; dispatch: Dispatch<DesignAction> }) {
  const logo = design.customLogos.find((l) => l.zone === zone.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const prepared = await prepareLogoFile(file);
      dispatch({
        type: "addLogo",
        logo: {
          id: `${zone.id}-${Date.now().toString(36)}`,
          zone: zone.id,
          kind: logo?.kind ?? zone.defaultKind,
          name: file.name.slice(0, 120),
          src: prepared.src,
          aspect: prepared.aspect,
          scale: logo?.scale ?? 1,
          offsetX: logo?.offsetX ?? zone.defaultOffset[0],
          offsetY: logo?.offsetY ?? zone.defaultOffset[1],
        },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const rect = logo ? customLogoRect(zone, logo) : null;
  const canMoveX = !!rect && zone.face !== "sleeve" && zone.region.hw - rect.hw > 0.002;
  const canMoveY = !!rect && zone.face !== "sleeve" && zone.region.hh - rect.hh > 0.002;

  return (
    <div className="rounded-xl border border-line p-3.5">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg bg-[repeating-conic-gradient(#EFEFEC_0%_25%,#fff_0%_50%)] bg-[length:12px_12px]">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.src} alt="" className="max-h-10 max-w-10 object-contain" />
          ) : (
            <ImagePlus size={18} className="text-ash" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-ink">{zone.label}</div>
          <div className="truncate text-[11.5px] text-ash">{logo ? logo.name : "Aucun logo"}</div>
        </div>
        {logo ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-sharp p-2 text-stone transition-colors hover:bg-paper hover:text-ink"
              aria-label={`Remplacer le logo — ${zone.label}`}
              title="Remplacer"
            >
              <RefreshCw size={15} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "removeLogo", id: logo.id })}
              className="rounded-sharp p-2 text-stone transition-colors hover:bg-danger-soft hover:text-danger"
              aria-label={`Supprimer le logo — ${zone.label}`}
              title="Supprimer"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-sharp border border-line px-3 py-2 text-[12px] font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:opacity-50"
          >
            <Upload size={13} aria-hidden />
            {busy ? "…" : "Importer"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}

      {logo && (
        <div className="mt-3 border-t border-line-soft pt-2">
          <div className="mb-1 flex gap-1.5">
            {(["club", "sponsor"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => dispatch({ type: "updateLogo", id: logo.id, patch: { kind } })}
                aria-pressed={logo.kind === kind}
                className={cn(
                  "rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  logo.kind === kind ? "bg-ink text-white" : "bg-paper text-stone hover:text-ink",
                )}
              >
                {kind === "club" ? "Logo du club" : "Sponsor"}
              </button>
            ))}
          </div>
          <Slider
            label="Taille"
            value={logo.scale}
            min={LOGO_SCALE_MIN}
            max={LOGO_SCALE_MAX}
            step={0.01}
            onChange={(scale) => dispatch({ type: "updateLogo", id: logo.id, patch: { scale } })}
            format={(v) => `${Math.round(v * 100)} %`}
          />
          {canMoveX && (
            <Slider
              label="Position horizontale"
              value={logo.offsetX}
              min={-1}
              max={1}
              step={0.01}
              onChange={(offsetX) => dispatch({ type: "updateLogo", id: logo.id, patch: { offsetX } })}
              format={(v) => (Math.abs(v) < 0.02 ? "centré" : v < 0 ? "← gauche" : "droite →")}
            />
          )}
          {canMoveY && (
            <Slider
              label="Position verticale"
              value={logo.offsetY}
              min={-1}
              max={1}
              step={0.01}
              onChange={(offsetY) => dispatch({ type: "updateLogo", id: logo.id, patch: { offsetY } })}
              format={(v) => (Math.abs(v) < 0.02 ? "centré" : v < 0 ? "↓ bas" : "haut ↑")}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function StepLogos({ design, dispatch, model }: StepProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-ink p-4 text-white">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-caps text-green-light">
          <Lock size={13} aria-hidden /> Signature Lemnos
        </div>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-fog">
          Trois logos fixes, présents sur chaque maillot. Seule leur couleur se personnalise (étape Couleurs).
        </p>
        <ul className="mt-2.5 space-y-1 text-[12px] text-mute-ink">
          {LEMNOS_PLACEMENT_LABELS.map((l) => (
            <li key={l} className="flex items-center gap-2">
              <Swatch hex={design.lemnosLogoColor} className="h-3 w-3" /> {l}
            </li>
          ))}
        </ul>
      </div>
      {model.customZones.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} design={design} dispatch={dispatch} />
      ))}
      <p className="px-1 text-[11.5px] leading-[1.55] text-ash">
        PNG, JPEG, WebP ou SVG · 5 Mo max. Les fichiers sont convertis en PNG dans votre navigateur ; privilégiez un
        fond transparent.
      </p>
    </div>
  );
}

// ── 5. Nom & numéro ───────────────────────────────────────────────────────
export function StepText({ design, dispatch }: StepProps) {
  const t = design.playerText;
  const set = (patch: Partial<DesignConfig["playerText"]>) => dispatch({ type: "text", patch });
  const field =
    "h-11 w-full rounded-field border-[1.5px] border-line bg-white px-3.5 text-[15px] font-semibold uppercase tracking-caps text-ink outline-none transition-colors placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-ash focus:border-green";
  return (
    <div className="space-y-4">
      <Toggle label="Flocage nom et numéro" hint="Au dos du maillot" checked={t.enabled} onChange={(enabled) => set({ enabled })} />
      {t.enabled && (
        <>
          <div className="grid grid-cols-[1fr_88px] gap-2.5">
            <label className="block">
              <span className={LABEL}>Nom</span>
              <input
                value={t.name}
                onChange={(e) => set({ name: e.target.value })}
                maxLength={PLAYER_NAME_MAX}
                placeholder="Nom du joueur"
                className={cn(field, "mt-1.5")}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Numéro</span>
              <input
                value={t.number}
                onChange={(e) => set({ number: e.target.value })}
                inputMode="numeric"
                maxLength={2}
                placeholder="10"
                className={cn(field, "mt-1.5 text-center")}
              />
            </label>
          </div>
          <div>
            <div className={cn(LABEL, "mb-2")}>Typographie</div>
            <div role="radiogroup" aria-label="Typographie" className="grid grid-cols-5 gap-1.5">
              {TEXT_FONTS.map((f) => {
                const face = TEXT_FONT_FACES[f.id];
                const active = t.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set({ font: f.id })}
                    className={cn(
                      "flex flex-col items-center rounded-lg border-[1.5px] pb-1.5 pt-1 transition-colors",
                      active ? "border-green bg-green-soft/50" : "border-line hover:border-stone",
                    )}
                  >
                    <span className="text-[26px] leading-[1.15] text-ink" style={{ fontFamily: face.family, fontWeight: face.weight }}>
                      {t.number || "10"}
                    </span>
                    <span className="text-[10px] font-semibold text-stone">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className={cn(LABEL, "mb-2.5")}>Couleur du texte</div>
            <ColorPicker label="Couleur du texte" value={t.color} onChange={(color) => set({ color })} />
          </div>
          <Toggle label="Contour" hint="Liseré autour des lettres et chiffres" checked={t.outline} onChange={(outline) => set({ outline })} />
          {t.outline && (
            <ColorPicker label="Couleur du contour" value={t.outlineColor} onChange={(outlineColor) => set({ outlineColor })} />
          )}
        </>
      )}
    </div>
  );
}

// ── 6. Finitions ──────────────────────────────────────────────────────────
export function StepFinish({ design, dispatch }: StepProps) {
  const f = design.finish;
  const set = (patch: Partial<DesignConfig["finish"]>) => dispatch({ type: "finish", patch });
  return (
    <div className="space-y-3">
      <div>
        <div className={cn(LABEL, "mb-2")}>Encolure</div>
        <div role="radiogroup" aria-label="Encolure" className="grid grid-cols-2 gap-2">
          {NECK_STYLES.map((n) => (
            <button
              key={n.id}
              type="button"
              role="radio"
              aria-checked={f.neck === n.id}
              onClick={() => set({ neck: n.id })}
              className={cn(
                "rounded-lg border-[1.5px] px-3 py-2.5 text-[13px] font-semibold transition-colors",
                f.neck === n.id ? "border-green bg-green-soft/50 text-green" : "border-line text-slate hover:border-stone",
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-line-soft">
        <Toggle label="Panneaux latéraux" hint="Bandes de couleur sur les flancs" checked={f.sidePanels} onChange={(sidePanels) => set({ sidePanels })} />
        <Toggle label="Liserés de manche" hint="Bande en bout de manche" checked={f.cuffTrim} onChange={(cuffTrim) => set({ cuffTrim })} />
        <Toggle label="Bande basse" hint="Bande en bas du maillot" checked={f.hemTrim} onChange={(hemTrim) => set({ hemTrim })} />
      </div>
      <p className="text-[11.5px] text-ash">Les couleurs de ces finitions se règlent à l&apos;étape Couleurs.</p>
    </div>
  );
}

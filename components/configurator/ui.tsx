"use client";

import { useId, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { PALETTE } from "@/lib/configurator/options";
import type { Hex } from "@/lib/configurator/types";

export const LABEL = "text-[11px] font-semibold uppercase tracking-caps text-stone";

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-ash">{hint}</span>}
      </span>
      <span className="relative flex-none">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-[22px] w-[38px] rounded-pill bg-line transition-colors peer-checked:bg-green peer-focus-visible:ring-2 peer-focus-visible:ring-green/40" />
        <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-pill bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const id = useId();
  return (
    <div className="py-1.5">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[12.5px] font-medium text-slate">
          {label}
        </label>
        <span className="text-[12px] tabular-nums text-ash">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full cursor-pointer accent-green"
      />
    </div>
  );
}

const HEX_INPUT_RE = /^#[0-9a-fA-F]{6}$/;

/** Palette prédéfinie + sélecteur libre (pipette native + saisie hexadécimale). */
export function ColorPicker({ value, onChange, label }: { value: Hex; onChange: (hex: Hex) => void; label: string }) {
  const [draft, setDraft] = useState<string>(value);
  const [lastValue, setLastValue] = useState<string>(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }
  return (
    <div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-10 gap-1.5">
        {PALETTE.map((c) => {
          const active = c.hex.toUpperCase() === value.toUpperCase();
          return (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={c.name}
              title={c.name}
              onClick={() => onChange(c.hex)}
              className={cn(
                "relative aspect-square w-full rounded-xs border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50",
                active ? "border-ink ring-2 ring-ink/80 ring-offset-1" : "border-black/10",
              )}
              style={{ background: c.hex }}
            >
              {active && (
                <Check
                  size={12}
                  strokeWidth={3}
                  aria-hidden
                  className="absolute inset-0 m-auto"
                  color={["#FFFFFF", "#F4F4F2", "#FFE14D", "#C7CCC9", "#F4C20D", "#7FB79A", "#5DADE2"].includes(c.hex) ? "#1A1D1F" : "#FFFFFF"}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="relative h-9 w-9 flex-none cursor-pointer overflow-hidden rounded-field border border-line" title="Couleur personnalisée">
          <span className="absolute inset-0" style={{ background: value }} />
          <input
            type="color"
            value={value.toLowerCase()}
            onChange={(e) => onChange(e.target.value.toUpperCase() as Hex)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} — couleur personnalisée`}
          />
        </label>
        <input
          value={draft}
          onChange={(e) => {
            const v = e.target.value.trim();
            setDraft(v);
            if (HEX_INPUT_RE.test(v)) onChange(v.toUpperCase() as Hex);
          }}
          maxLength={7}
          spellCheck={false}
          aria-label={`${label} — code hexadécimal`}
          className={cn(
            "h-9 w-[104px] rounded-field border-[1.5px] bg-white px-2.5 font-mono text-[13px] uppercase outline-none transition-colors focus:border-green",
            HEX_INPUT_RE.test(draft) ? "border-line" : "border-danger",
          )}
        />
        <span className="text-[12px] text-ash">Palette ou code libre</span>
      </div>
    </div>
  );
}

export function Swatch({ hex, className }: { hex: string; className?: string }) {
  return <span className={cn("inline-block h-4 w-4 flex-none rounded-[3px] border border-black/10", className)} style={{ background: hex }} />;
}

export function Note({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" }) {
  return (
    <p
      className={cn(
        "rounded-field px-3 py-2.5 text-[12.5px] leading-[1.55]",
        tone === "warn" ? "bg-danger-soft text-danger" : "bg-paper text-stone",
      )}
    >
      {children}
    </p>
  );
}

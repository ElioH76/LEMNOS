"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Briques d'interface partagées de la gestion commerciale (même DA que l'admin). */

export const FIELD =
  "w-full rounded-field border-[1.5px] border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ash focus:border-green disabled:bg-paper disabled:text-stone";
export const LABEL = "mb-1.5 block text-[12px] font-semibold text-ink";
export const BTN =
  "inline-flex items-center justify-center gap-2 rounded-sharp border border-line bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:cursor-not-allowed disabled:opacity-50";
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-sharp bg-green px-4 py-2.5 text-[13px] font-semibold uppercase tracking-btn text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60";
export const BTN_DANGER =
  "inline-flex items-center justify-center gap-2 rounded-sharp px-3.5 py-2.5 text-[13px] font-semibold text-ash transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50";

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  className,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
      />
      {hint && <p className="mt-1 text-[11.5px] text-ash">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD, "resize-y")}
      />
      {hint && <p className="mt-1 text-[11.5px] text-ash">{hint}</p>}
    </div>
  );
}

/** Champ numérique : garde la saisie libre, renvoie un nombre (0 si vide). */
export function NumberInput({
  value,
  onChange,
  step = "0.01",
  min = 0,
  max,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: number;
  max?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      aria-label={ariaLabel}
      value={Number.isFinite(value) && value !== 0 ? value : ""}
      placeholder="0"
      onChange={(e) => {
        const v = parseFloat(e.target.value.replace(",", "."));
        onChange(Number.isFinite(v) ? v : 0);
      }}
      className={cn(FIELD, "tabular-nums", className)}
    />
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-field border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
      {children}
    </p>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="rounded-field border border-green/30 bg-green-soft px-3.5 py-3 text-[13px] font-medium text-green-dark">
      {children}
    </p>
  );
}

export function WarnNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-field border border-[#D9A45B]/60 bg-[#FFF4E3] px-3.5 py-3 text-[13px] leading-[1.55] text-[#7A4A10]">
      {children}
    </div>
  );
}

/** Fenêtre modale légère (plein écran sur mobile). */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-immersive sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-bold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-md p-1.5 text-ash transition-colors hover:bg-paper hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow = "Gestion commerciale",
  title,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-caps text-green">{eyebrow}</div>
        <h1 className="mt-1.5 text-[24px] font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

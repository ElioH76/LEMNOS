"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Minus, Plus, RotateCcw } from "lucide-react";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { cn } from "@/lib/cn";
import { defaultDesign } from "@/lib/configurator/defaults";
import { getModel } from "@/lib/configurator/models";
import { decodeShareHash, encodeShareHash } from "@/lib/configurator/share";
import type { DesignConfig } from "@/lib/configurator/types";
import { sanitizeDesign } from "@/lib/configurator/validate";
import { ExportDialog } from "./ExportDialog";
import { composeSheet, downloadBlob, downloadDesignJson, loadDraft, saveDraft } from "./persistence";
import { QuoteDialog } from "./QuoteDialog";
import { designReducer } from "./state";
import { StepColors, StepFinish, StepLogos, StepModel, StepPatterns, StepText } from "./steps";
import { Summary } from "./Summary";
import type { BrandStatus } from "./three/Jersey";
import type { ViewerApi, ViewName } from "./three/api";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";

const Viewer = dynamic(() => import("./three/Viewer"), {
  ssr: false,
  loading: () => <ViewerMessage title="Chargement du moteur 3D…" spinner />,
});

const STEPS = [
  { id: "model", title: "Modèle", Component: StepModel },
  { id: "colors", title: "Couleurs", Component: StepColors },
  { id: "patterns", title: "Motifs", Component: StepPatterns },
  { id: "logos", title: "Logos & sponsors", Component: StepLogos },
  { id: "text", title: "Nom & numéro", Component: StepText },
  { id: "finish", title: "Finitions", Component: StepFinish },
] as const;
type StepId = (typeof STEPS)[number]["id"] | "summary";

function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function detectQuality(): "high" | "low" {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const small = window.matchMedia("(max-width: 767px)").matches;
  return cores <= 4 || memory <= 4 || small ? "low" : "high";
}

/** Design initial : lien partagé > brouillon local > design par défaut (toujours validé). */
function initialState(): { design: DesignConfig; notice: string | null } {
  const shared = decodeShareHash(window.location.hash);
  if (shared) {
    const { design, warnings } = sanitizeDesign(shared);
    return { design, notice: ["Design chargé depuis le lien partagé.", ...warnings].join(" ") };
  }
  const draft = loadDraft();
  if (draft) {
    const { design } = sanitizeDesign(draft);
    return { design, notice: "Brouillon restauré." };
  }
  return { design: defaultDesign(), notice: null };
}

function ViewerMessage({ title, body, spinner, action }: { title: string; body?: string; spinner?: boolean; action?: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="max-w-[340px] text-center">
        {spinner && <span className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-2 border-line border-t-green" aria-hidden />}
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {body && <p className="mt-2 text-[13px] leading-[1.6] text-stone">{body}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

const TOOL_BTN =
  "flex h-10 min-w-10 items-center justify-center rounded-sharp px-3 text-[12px] font-semibold text-slate transition-colors hover:bg-paper hover:text-ink";

export default function Configurator() {
  const [init] = useState(initialState);
  const [design, dispatch] = useReducer(designReducer, init.design);
  const model = getModel(design.modelId)!;
  const [step, setStep] = useState<StepId>("colors");
  const [toast, setToast] = useState<string | null>(init.notice);
  const [draftState, setDraftState] = useState<"idle" | "saved" | "partial" | "failed">("idle");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [brand, setBrand] = useState<{ status: BrandStatus; error?: string }>({ status: "loading" });
  const [contextLost, setContextLost] = useState(false);
  const [view, setView] = useState<ViewName>("front");
  const env = useMemo(() => ({ webgl: detectWebGL(), quality: detectQuality() }), []);
  const apiRef = useRef<ViewerApi | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const canRender = env.webgl && brand.status === "ready" && !contextLost;

  // Notification éphémère
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Brouillon local, enregistré automatiquement.
  useEffect(() => {
    const t = setTimeout(() => {
      const r = saveDraft(design);
      setDraftState(r === "full" ? "saved" : r === "without-logos" ? "partial" : "failed");
    }, 700);
    return () => clearTimeout(t);
  }, [design]);

  // Un lien partagé n'est lu qu'une fois : on nettoie l'URL.
  useEffect(() => {
    if (window.location.hash.includes("d=")) history.replaceState(null, "", window.location.pathname);
  }, []);

  const onBrandStatus = useCallback((status: BrandStatus, error?: string) => setBrand({ status, error }), []);

  const goView = (v: ViewName) => {
    setView(v);
    apiRef.current?.setView(v);
  };

  const capture = useCallback(
    (background: string | null, size: number, format: "image/png" | "image/jpeg") => {
      if (!canRender || !apiRef.current) return null;
      return apiRef.current.capture({ background, size, format });
    },
    [canRender],
  );

  const actions = {
    onSave: () => {
      const r = saveDraft(design);
      setToast(
        r === "full"
          ? "Design sauvegardé dans ce navigateur."
          : r === "without-logos"
            ? "Sauvegardé sans les logos (espace navigateur insuffisant) — exportez le JSON pour tout garder."
            : "Sauvegarde locale impossible — exportez le JSON.",
      );
    },
    onExportJson: () => downloadDesignJson(design),
    onImportJson: () => importRef.current?.click(),
    onShare: async () => {
      const url = `${window.location.origin}${window.location.pathname}#${encodeShareHash(design)}`;
      try {
        await navigator.clipboard.writeText(url);
        setToast(
          design.customLogos.length
            ? "Lien copié. Les logos importés n'y sont pas inclus : joignez le JSON pour les transmettre."
            : "Lien de partage copié dans le presse-papiers.",
        );
      } catch {
        window.prompt("Copiez ce lien :", url);
      }
    },
    onExportImage: () => setExportOpen(true),
    onQuote: () => setQuoteOpen(true),
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Fichier trop volumineux.");
      const raw = JSON.parse(await file.text());
      const { design: imported, warnings } = sanitizeDesign(raw);
      dispatch({ type: "load", design: imported });
      setToast(["Configuration importée.", ...warnings].join(" "));
    } catch {
      setToast("Fichier invalide : ce n'est pas une configuration Lemnos.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const exportSheet = async ({ transparent, club }: { transparent: boolean; club: string }) => {
    const views = capture(transparent ? null : "#F4F4F2", 1400, "image/png");
    if (!views) throw new Error("Rendu 3D indisponible.");
    const blob = await composeSheet(views, { designId: design.designId, club, transparent });
    downloadBlob(blob, `lemnos-${design.designId}.png`);
  };

  const viewerArea = (
    <div className="relative h-full w-full bg-[radial-gradient(120%_90%_at_50%_30%,#ffffff_0%,#F4F4F2_55%,#E9EAE7_100%)]">
      {!env.webgl ? (
        <ViewerMessage
          title="La 3D n'est pas disponible sur cet appareil."
          body="Votre navigateur ne prend pas en charge WebGL (ou il est désactivé). Vous pouvez tout de même nous décrire votre projet."
          action={
            <a href="/#projet" className="rounded-sharp bg-green px-4 py-2.5 text-[12px] font-semibold uppercase tracking-caps text-white">
              Formulaire projet
            </a>
          }
        />
      ) : contextLost ? (
        <ViewerMessage
          title="Le rendu 3D s'est interrompu."
          body="Votre design est conservé (brouillon local)."
          action={
            <button type="button" onClick={() => window.location.reload()} className="rounded-sharp bg-green px-4 py-2.5 text-[12px] font-semibold uppercase tracking-caps text-white">
              Recharger
            </button>
          }
        />
      ) : (
        <ViewerErrorBoundary fallback={(message) => <ViewerMessage title="Impossible d'afficher le maillot 3D." body={message} />}>
          <Viewer
            model={model}
            design={design}
            quality={env.quality}
            apiRef={apiRef}
            onBrandStatus={onBrandStatus}
            onContextLost={() => setContextLost(true)}
          />
        </ViewerErrorBoundary>
      )}

      {env.webgl && !contextLost && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 md:left-5 md:top-5">
            {model.demo && (
              <span className="w-fit rounded-pill bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-caps text-stone shadow-card backdrop-blur">
                Modèle 3D de démonstration
              </span>
            )}
            {brand.status === "loading" && (
              <span className="w-fit rounded-pill bg-white/85 px-2.5 py-1 text-[11px] text-stone backdrop-blur">Chargement du logo Lemnos…</span>
            )}
          </div>
          {brand.status === "error" && (
            <div className="absolute inset-x-3 top-12 mx-auto max-w-[420px] rounded-lg bg-danger-soft px-4 py-3 text-[12.5px] leading-[1.5] text-danger md:top-16">
              <strong className="font-semibold">Logo Lemnos officiel indisponible.</strong> {brand.error} L&apos;export et la demande de devis
              sont bloqués tant que les trois logos ne sont pas affichés.
            </div>
          )}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg bg-white/90 p-1 shadow-card-hover backdrop-blur md:bottom-5">
            {(["front", "back"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => goView(v)}
                aria-pressed={view === v}
                className={cn(TOOL_BTN, view === v && "bg-ink text-white hover:bg-ink hover:text-white")}
              >
                {v === "front" ? "Face" : "Dos"}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-line" aria-hidden />
            <button type="button" onClick={() => apiRef.current?.zoom(-0.35)} className={TOOL_BTN} aria-label="Dézoomer">
              <Minus size={16} aria-hidden />
            </button>
            <button type="button" onClick={() => apiRef.current?.zoom(0.35)} className={TOOL_BTN} aria-label="Zoomer">
              <Plus size={16} aria-hidden />
            </button>
            <button type="button" onClick={() => apiRef.current?.reset()} className={TOOL_BTN} aria-label="Réinitialiser la vue" title="Réinitialiser la vue">
              <RotateCcw size={15} aria-hidden />
            </button>
          </div>
          <p className="pointer-events-none absolute bottom-[70px] left-1/2 hidden -translate-x-1/2 text-[11px] text-ash md:block">
            Glisser pour tourner · molette pour zoomer
          </p>
        </>
      )}
    </div>
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-ink">
      {/* Barre supérieure */}
      <header className="flex h-14 flex-none items-center justify-between gap-3 bg-ink px-4 text-white md:px-6">
        <a href="/" aria-label="Lemnos — retour au site" className="text-white hover:text-white">
          <LogoLockup markClassName="w-[24px] text-white" wordmarkClassName="text-[15px]" />
        </a>
        <div className="hidden items-baseline gap-2 sm:flex">
          <span className="font-serif text-[15px] tracking-brand text-white">Configurateur</span>
          <span className="font-mono text-[11px] text-mute-ink">{design.designId}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-mute-ink md:inline" aria-live="polite">
            {draftState === "saved" && "Brouillon enregistré"}
            {draftState === "partial" && "Brouillon enregistré sans logos"}
            {draftState === "failed" && "Brouillon non enregistré"}
          </span>
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            disabled={!canRender}
            className="rounded-sharp bg-green px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:opacity-50"
          >
            Devis
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[340px_minmax(0,1fr)_320px]">
        {/* Étapes — accordéon (ordinateur) */}
        <aside className="hidden min-h-0 overflow-y-auto border-r border-line lg:block" aria-label="Personnalisation">
          {STEPS.map((s, i) => {
            const open = step === s.id;
            const { Component } = s;
            return (
              <section key={s.id} className="border-b border-line-soft">
                <h2>
                  <button
                    type="button"
                    onClick={() => setStep(open ? "summary" : s.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-paper/60"
                  >
                    <span className={cn("font-mono text-[11px] font-semibold", open ? "text-green" : "text-ash")}>0{i + 1}</span>
                    <span className="flex-1 text-[14px] font-semibold tracking-tight">{s.title}</span>
                    <ChevronDown size={16} aria-hidden className={cn("text-ash transition-transform duration-200", open && "rotate-180")} />
                  </button>
                </h2>
                <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    {open && (
                      <div className="px-5 pb-6 pt-1">
                        <Component design={design} dispatch={dispatch} model={model} />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </aside>

        {/* Aperçu 3D */}
        <main className="relative h-[46dvh] flex-none lg:h-auto lg:min-h-0" aria-label="Aperçu 3D du maillot">
          {viewerArea}
        </main>

        {/* Récapitulatif (ordinateur) */}
        <aside className="hidden min-h-0 border-l border-line lg:block" aria-label="Récapitulatif">
          <Summary design={design} actions={actions} canRender={canRender} />
        </aside>

        {/* Mobile / tablette : onglets d'étapes + contenu */}
        <div className="flex min-h-0 flex-1 flex-col border-t border-line lg:hidden">
          <nav className="flex flex-none gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none]" aria-label="Étapes">
            {[...STEPS.map((s) => ({ id: s.id as StepId, title: s.title })), { id: "summary" as StepId, title: "Récap" }].map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                aria-current={step === s.id ? "step" : undefined}
                className={cn(
                  "flex-none rounded-pill px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                  step === s.id ? "bg-ink text-white" : "bg-paper text-slate",
                )}
              >
                {s.id !== "summary" && <span className="mr-1 font-mono text-[10.5px] opacity-60">{i + 1}</span>}
                {s.title}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {step === "summary" ? (
              <Summary design={design} actions={actions} canRender={canRender} />
            ) : (
              <div className="px-4 pb-8 pt-2">
                {STEPS.filter((s) => s.id === step).map(({ id, Component }) => (
                  <Component key={id} design={design} dispatch={dispatch} model={model} />
                ))}
                <div className="mt-6 flex gap-2">
                  {stepIndex > 0 && (
                    <button type="button" onClick={() => setStep(STEPS[stepIndex - 1].id)} className="flex-1 rounded-sharp border border-line py-3 text-[12px] font-semibold text-slate">
                      Précédent
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(stepIndex < STEPS.length - 1 ? STEPS[stepIndex + 1].id : "summary")}
                    className="flex-1 rounded-sharp bg-ink py-3 text-[12px] font-semibold uppercase tracking-caps text-white"
                  >
                    {stepIndex < STEPS.length - 1 ? "Suivant" : "Récapitulatif"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} onChange={(e) => onImportFile(e.target.files?.[0])} />

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-[460px] -translate-x-1/2 animate-reveal rounded-lg bg-ink px-4 py-3 text-[13px] leading-[1.5] text-white shadow-immersive lg:bottom-6">
          {toast}
        </div>
      )}

      <QuoteDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        design={design}
        capturePreviews={() => capture("#F4F4F2", 1000, "image/jpeg")}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} onExport={exportSheet} />
    </div>
  );
}

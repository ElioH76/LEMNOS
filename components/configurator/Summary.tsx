"use client";

import { Download, FileUp, ImageDown, Link2, Lock, Save, Send } from "lucide-react";
import { getModel } from "@/lib/configurator/models";
import { COLOR_ZONES, NECK_STYLES, PATTERNS, TEXT_FONTS } from "@/lib/configurator/options";
import { estimateUnitPrice, PRICING } from "@/lib/configurator/pricing";
import type { DesignConfig } from "@/lib/configurator/types";
import { LABEL, Swatch } from "./ui";

export interface SummaryActions {
  onSave: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onShare: () => void;
  onExportImage: () => void;
  onQuote: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-[12.5px]">
      <span className="flex-none text-stone">{label}</span>
      <span className="min-w-0 text-right font-medium text-ink">{children}</span>
    </div>
  );
}

const SECONDARY_BTN =
  "flex items-center justify-center gap-1.5 rounded-sharp border border-line bg-white px-2.5 py-2.5 text-[11.5px] font-semibold text-slate transition-colors hover:border-green hover:text-green disabled:cursor-not-allowed disabled:opacity-50";

export function Summary({
  design,
  actions,
  canRender,
}: {
  design: DesignConfig;
  actions: SummaryActions;
  /** false tant que les logos Lemnos ne sont pas chargés (export / devis bloqués). */
  canRender: boolean;
}) {
  const model = getModel(design.modelId);
  const price = estimateUnitPrice(design);
  const t = design.playerText;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <div className={LABEL}>Votre création</div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-[16px] font-bold tracking-tight text-ink">{model?.name}</span>
            <span className="font-mono text-[11.5px] text-ash">{design.designId}</span>
          </div>
        </div>

        <div>
          <div className={LABEL}>Couleurs</div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {COLOR_ZONES.map((z) => (
              <li key={z.id} className="flex min-w-0 items-center gap-2 text-[12px] text-slate">
                <Swatch hex={design.colors[z.id]} />
                <span className="truncate">{z.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="divide-y divide-line-soft border-y border-line-soft">
          <Row label="Motif">
            {PATTERNS.find((p) => p.id === design.pattern.id)?.label}
            {design.pattern.id !== "plain" && <span className="text-ash"> ×{design.pattern.scale.toFixed(2)}</span>}
          </Row>
          <Row label="Encolure">{NECK_STYLES.find((n) => n.id === design.finish.neck)?.label}</Row>
          <Row label="Finitions">
            {[
              design.finish.sidePanels && "Panneaux",
              design.finish.cuffTrim && "Liserés",
              design.finish.hemTrim && "Bande basse",
            ]
              .filter(Boolean)
              .join(" · ") || "Aucune"}
          </Row>
          <Row label="Flocage">
            {t.enabled ? `${t.name || "—"} · ${t.number || "—"} · ${TEXT_FONTS.find((f) => f.id === t.font)?.label}` : "Aucun"}
          </Row>
          <Row label="Logos client">
            {design.customLogos.length
              ? design.customLogos.map((l) => model?.customZones.find((z) => z.id === l.zone)?.label).join(", ")
              : "Aucun"}
          </Row>
          <Row label="Logos Lemnos">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={11} className="text-green" aria-hidden />3 fixes
              <Swatch hex={design.lemnosLogoColor} className="h-3.5 w-3.5" />
            </span>
          </Row>
        </div>

        <div className="rounded-xl bg-paper p-4">
          <div className={LABEL}>Tarif</div>
          {price.available ? (
            <div className="mt-1 text-[20px] font-bold text-ink">
              {price.unitHT.toLocaleString("fr-FR", { style: "currency", currency: PRICING.currency })}
              <span className="text-[12px] font-medium text-stone"> HT / pièce</span>
            </div>
          ) : (
            <>
              <div className="mt-1 text-[16px] font-bold text-ink">Sur devis</div>
              <p className="mt-1 text-[12px] leading-[1.5] text-stone">Selon quantités, tailles et options. Réponse sous 48 h.</p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-line bg-white p-4">
        <button
          type="button"
          onClick={actions.onQuote}
          disabled={!canRender}
          className="flex w-full items-center justify-center gap-2 rounded-sharp bg-green px-4 py-3.5 text-[12.5px] font-semibold uppercase tracking-caps text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} aria-hidden /> Demander un devis
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={actions.onSave} className={SECONDARY_BTN}>
            <Save size={14} aria-hidden /> Sauvegarder
          </button>
          <button type="button" onClick={actions.onExportImage} disabled={!canRender} className={SECONDARY_BTN}>
            <ImageDown size={14} aria-hidden /> Aperçu PNG
          </button>
          <button type="button" onClick={actions.onShare} className={SECONDARY_BTN}>
            <Link2 size={14} aria-hidden /> Lien
          </button>
          <button type="button" onClick={actions.onExportJson} className={SECONDARY_BTN}>
            <Download size={14} aria-hidden /> JSON
          </button>
        </div>
        <button type="button" onClick={actions.onImportJson} className="flex w-full items-center justify-center gap-1.5 py-1.5 text-[11.5px] font-semibold text-stone transition-colors hover:text-green">
          <FileUp size={13} aria-hidden /> Importer une configuration
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { caseStudy, kitOrder, lookbookKits, type KitId } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

/** Étude de cas F.C. Littoral : présentation, sélecteur de tenue, galerie, caractéristiques. */
export function CaseStudy() {
  const [kitId, setKitId] = useState<KitId>("ext");
  const kit = lookbookKits[kitId];

  return (
    <section id="realisation" className="scroll-mt-20">
      <Shell className="flex flex-col gap-8 pb-10 pt-20 md:flex-row md:items-end md:justify-between md:pt-24">
        <div className="flex max-w-[640px] flex-col gap-[18px]">
          <Eyebrow>{caseStudy.eyebrow}</Eyebrow>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white p-1.5">
              <Image src={caseStudy.crest} alt="Blason du F.C. Littoral" width={44} height={44} className="h-auto w-full" />
            </span>
            <h2 className="font-serif text-[40px] font-bold leading-none text-white md:text-[52px]">
              {caseStudy.club}
            </h2>
          </div>
          <p className="text-[16px] leading-[1.6] text-fog">{caseStudy.intro}</p>
        </div>

        <div className="flex flex-none gap-2 overflow-x-auto">
          {kitOrder.map((id) => {
            const active = id === kitId;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setKitId(id)}
                className={cn(
                  "flex-none rounded-sharp border-[1.5px] border-white px-3.5 py-2.5 text-[13px] font-bold uppercase tracking-caps transition-colors sm:px-[18px]",
                  active ? "bg-white text-ink-deep" : "bg-transparent text-white hover:bg-white/10",
                )}
              >
                {lookbookKits[id].name}
              </button>
            );
          })}
        </div>
      </Shell>

      <div
        key={kit.id}
        className="reveal-in flex snap-x snap-mandatory gap-1 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible"
      >
        {kit.gallery.map((shot) => (
          <div
            key={shot.image}
            className="relative h-[440px] w-[82%] flex-none snap-start bg-ink md:h-[36vw] md:max-h-[640px] md:w-auto"
          >
            <Image src={shot.image} alt={shot.alt} fill sizes="(min-width: 768px) 33vw, 82vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="border-b border-night-line">
        <Shell className="grid grid-cols-2 gap-x-6 gap-y-8 py-14 md:gap-8 md:py-[72px] lg:grid-cols-4">
          {kit.specs.map((spec) => (
            <div key={`${kit.id}-${spec.label}`} className="flex flex-col gap-2">
              <span className="text-[12px] font-bold uppercase tracking-label text-mint">{spec.label}</span>
              <span className="text-[15px] leading-[1.5] text-pearl">{spec.value}</span>
            </div>
          ))}
        </Shell>
      </div>
    </section>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type TouchEvent,
} from "react";
import Image, { getImageProps } from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  collectionLabel,
  kitOrder,
  lookbookKits,
  lookbookSlides,
  type LookbookSlide,
} from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

const SLIDE_COUNT = lookbookSlides.length;
const pad = (n: number) => String(n).padStart(2, "0");

const ROUND_BTN =
  "flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-white/70 text-white transition-colors hover:border-white hover:bg-white hover:text-ink-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Photo d'une slide. Si la slide a une version mobile (cadrage portrait), un
 * <picture> sert l'une ou l'autre selon la largeur — une seule est téléchargée.
 */
function SlideImage({
  slide,
  priority,
  className,
}: {
  slide: LookbookSlide;
  priority: boolean;
  className: string;
}) {
  const common = { alt: slide.alt, fill: true, priority, sizes: "100vw" } as const;
  if (!slide.mobileImage)
    return (
      <Image src={slide.image} {...common} style={{ objectPosition: slide.position }} className={className} />
    );

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: slide.image });
  const {
    props: { style, ...mobileProps },
  } = getImageProps({ ...common, src: slide.mobileImage });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes="100vw" />
      {/* alt fourni par getImageProps */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...mobileProps}
        style={
          {
            ...style,
            "--pos-mobile": slide.mobilePosition ?? slide.position,
            "--pos-desktop": slide.position,
          } as CSSProperties
        }
        className={cn(className, "[object-position:var(--pos-mobile)] md:[object-position:var(--pos-desktop)]")}
      />
    </picture>
  );
}

/**
 * Accueil « Lookbook » : carrousel hero → sélecteur de tenue → galerie 3 photos
 * → caractéristiques. La tenue active est toujours celle de la slide affichée ;
 * cliquer une tenue saute à sa première slide.
 *
 * L'autoplay est piloté par la fin d'animation de la barre de progression
 * active (6 s) : survol souris ou onglet caché mettent l'animation — donc le
 * carrousel — en pause. Toute action manuelle relance le compte à rebours.
 */
export function Lookbook() {
  const [slide, setSlide] = useState(0);
  // Incrémenté à chaque changement : re-monte la barre active (timer relancé).
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback((index: number) => {
    setSlide(((index % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const kit = lookbookKits[lookbookSlides[slide].kit];

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHovered(true);
  };
  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) go(slide + (dx < 0 ? 1 : -1));
  };

  return (
    <>
      <section
        id="top"
        aria-roledescription="carrousel"
        aria-label={collectionLabel}
        onPointerEnter={onPointerEnter}
        onPointerLeave={() => setHovered(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          "relative h-[80svh] min-h-[560px] overflow-hidden bg-ink-deep md:h-[100svh] md:max-h-[880px] md:min-h-[640px]",
          (hovered || tabHidden) && "lookbook-paused",
        )}
      >
        <h1 className="sr-only">
          Lemnos — maillots de sport personnalisés. Réalisation : collection F.C. Littoral 2026.
        </h1>

        {/* Mobile : la photo occupe le haut, le texte se pose sur fond nuit en dessous
            (sinon le titre masque le maillot). Desktop : photo plein cadre. */}
        <div className="absolute inset-x-0 top-0 bottom-[36%] md:bottom-0">
        {lookbookSlides.map((s, i) => {
          const active = i === slide;
          return (
            <div
              key={s.image}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-[900ms] ease-in-out motion-reduce:duration-300",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              <SlideImage
                slide={s}
                priority={i === 0}
                className={cn(
                  "object-cover transition-transform duration-[6500ms] ease-out motion-reduce:transition-none",
                  active ? "scale-[1.06] motion-reduce:scale-100" : "scale-100",
                )}
              />
            </div>
          );
        })}
        </div>

        {/* Lisibilité : dégradé latéral en desktop ; en mobile, fondu de la photo vers le fond nuit. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(0deg,rgb(17,20,22)_0%,rgb(17,20,22)_36%,rgba(17,20,22,0.4)_52%,rgba(17,20,22,0)_72%)] md:bg-[linear-gradient(90deg,rgba(17,20,22,0.88)_0%,rgba(17,20,22,0.3)_55%,rgba(17,20,22,0)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(17,20,22,0.55),transparent)]"
        />

        <div className="absolute inset-x-0 bottom-16">
          <Shell className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between md:gap-10">
            <div aria-live="polite" className="flex max-w-[560px] flex-col gap-4 md:gap-5">
              <Eyebrow>{collectionLabel}</Eyebrow>
              <h2 key={kit.id} className="reveal-in font-serif text-[48px] font-bold leading-[0.95] text-white md:text-[72px]">
                {kit.name}
              </h2>
              <p className="text-[15px] leading-[1.6] text-pearl md:text-[17px]">{kit.desc}</p>
            </div>

            <div className="flex flex-none items-center gap-[18px]">
              <span className="text-[13px] font-bold tracking-[0.12em] text-white tabular-nums">
                {pad(slide + 1)} / {pad(SLIDE_COUNT)}
              </span>
              <button type="button" onClick={() => go(slide - 1)} aria-label="Photo précédente" className={ROUND_BTN}>
                <ArrowLeft size={18} aria-hidden />
              </button>
              <button type="button" onClick={() => go(slide + 1)} aria-label="Photo suivante" className={ROUND_BTN}>
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </Shell>
        </div>

        <div className="absolute inset-x-0 bottom-7">
          <Shell className="flex gap-2">
            {lookbookSlides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => go(i)}
                aria-label={`Photo ${i + 1} — ${lookbookKits[s.kit].name}`}
                aria-current={i === slide}
                className="h-4 flex-1 py-[6.5px]"
              >
                <span className="block h-[3px] overflow-hidden bg-white/30">
                  {i < slide && <span className="block h-full w-full bg-white" />}
                  {i === slide && (
                    <span
                      key={cycle}
                      onAnimationEnd={() => go(slide + 1)}
                      className="lookbook-progress block h-full w-full bg-white"
                    />
                  )}
                </span>
              </button>
            ))}
          </Shell>
        </div>
      </section>

      <div id="collection" className="scroll-mt-20 border-b border-night-line">
        <Shell className="flex gap-2 overflow-x-auto py-5">
          {kitOrder.map((id) => {
            const active = id === kit.id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => go(lookbookSlides.findIndex((s) => s.kit === id))}
                className={cn(
                  "flex-none rounded-sharp border-[1.5px] border-white px-3.5 py-2.5 sm:px-[18px] text-[13px] font-bold uppercase tracking-caps transition-colors",
                  active ? "bg-white text-ink-deep" : "bg-transparent text-white hover:bg-white/10",
                )}
              >
                {lookbookKits[id].name}
              </button>
            );
          })}
        </Shell>
      </div>

      <div
        key={kit.id}
        className="reveal-in flex snap-x snap-mandatory gap-1 overflow-x-auto pt-1 md:grid md:grid-cols-3 md:overflow-visible"
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
    </>
  );
}

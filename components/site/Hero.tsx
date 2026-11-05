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
  caseStudy,
  heroContent,
  lookbookKits,
  lookbookSlides,
  type LookbookSlide,
} from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

const SLIDE_COUNT = lookbookSlides.length;
const pad = (n: number) => String(n).padStart(2, "0");

const ROUND_BTN =
  "flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/70 text-white transition-colors hover:border-white hover:bg-white hover:text-ink-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:h-12 md:w-12";

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
 * Hero de l'accueil : la promesse Lemnos sur un carrousel de vraies photos.
 * Chaque photo est légendée (club · tenue) — la réalisation sert de preuve,
 * elle n'est pas le sujet.
 *
 * L'autoplay est piloté par la fin d'animation de la barre de progression
 * active (6 s) : survol souris ou onglet caché mettent l'animation — donc le
 * carrousel — en pause. Toute action manuelle relance le compte à rebours.
 */
export function Hero() {
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

  const caption = `${caseStudy.club} · ${lookbookKits[lookbookSlides[slide].kit].name}`;

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
    <section
      id="top"
      aria-roledescription="carrousel"
      aria-label="Réalisations Lemnos"
      onPointerEnter={onPointerEnter}
      onPointerLeave={() => setHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={cn(
        "relative overflow-hidden bg-ink-deep md:h-[100svh] md:max-h-[880px] md:min-h-[640px]",
        (hovered || tabHidden) && "lookbook-paused",
      )}
    >
      {/* Mobile : photo puis texte, empilés (le titre ne masque jamais le maillot).
          Desktop : photo plein cadre, texte superposé. */}
      <div className="relative h-[50svh] min-h-[320px] overflow-hidden md:absolute md:inset-0 md:h-auto md:min-h-0">
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
        {/* Mobile : fondu du bas de la photo vers le fond nuit. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgb(17,20,22),transparent)] md:hidden"
        />
      </div>

      {/* Desktop : dégradé latéral de lisibilité. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(17,20,22,0.9)_0%,rgba(17,20,22,0.4)_50%,rgba(17,20,22,0)_100%)] md:block"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(17,20,22,0.55),transparent)]"
      />

      <div className="relative -mt-8 pb-14 md:absolute md:inset-x-0 md:bottom-16 md:mt-0 md:pb-0">
        <Shell className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex max-w-[600px] flex-col gap-4 md:gap-5">
            <Eyebrow>{heroContent.eyebrow}</Eyebrow>
            <h1 className="text-balance font-serif text-[40px] font-bold leading-[1] text-white md:text-[56px] lg:text-[64px] lg:leading-[0.98]">
              {heroContent.title}
            </h1>
            <p className="max-w-[48ch] text-[15px] leading-[1.6] text-pearl md:text-[17px]">{heroContent.desc}</p>
            <div className="mt-2 flex flex-col gap-3 min-[480px]:flex-row">
              <a
                href="#demande"
                className="rounded-sharp bg-green px-5 py-3 text-center text-[14px] font-bold text-white transition-colors hover:bg-green-dark"
              >
                Demander mon maillot
              </a>
              <a
                href="#realisation"
                className="rounded-sharp border-[1.5px] border-white px-5 py-3 text-center text-[14px] font-bold text-white transition-colors hover:bg-white hover:text-ink-deep"
              >
                Voir la réalisation
              </a>
            </div>
          </div>

          {/* Mobile : légende à gauche, flèches à droite sur une seule ligne. */}
          <div className="flex flex-none items-center justify-between gap-3 lg:flex-col lg:items-end lg:justify-start">
            <span aria-live="polite" className="text-[11px] font-bold uppercase tracking-label text-mint md:text-[12px]">
              {caption}
            </span>
            <div className="flex items-center gap-2.5 md:gap-[18px]">
              <span className="hidden text-[13px] font-bold tracking-[0.12em] text-white tabular-nums sm:inline">
                {pad(slide + 1)} / {pad(SLIDE_COUNT)}
              </span>
              <button type="button" onClick={() => go(slide - 1)} aria-label="Photo précédente" className={ROUND_BTN}>
                <ArrowLeft size={18} aria-hidden />
              </button>
              <button type="button" onClick={() => go(slide + 1)} aria-label="Photo suivante" className={ROUND_BTN}>
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </div>
        </Shell>
      </div>

      <div className="absolute inset-x-0 bottom-6 md:bottom-7">
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
  );
}

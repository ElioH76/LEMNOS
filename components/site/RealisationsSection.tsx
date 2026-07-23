import Image from "next/image";
import { featuredCollection, realisations } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";
import { MythPattern } from "./MythPattern";
import { Reveal } from "./Reveal";

export function RealisationsSection() {
  return (
    <section id="realisations" className="relative scroll-mt-24 overflow-hidden bg-ink py-24 text-white md:py-28">
      {/* écailles antiques — motif commun à toutes les sections sombres */}
      <MythPattern
        variant="scales"
        id="scales-realisations"
        className="text-white/[0.06] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_85%_-10%,rgba(30,91,60,0.28),transparent_60%)]"
      />

      <Shell className="relative">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <Eyebrow tone="dark">Réalisations</Eyebrow>
              <h2 className="mt-5 max-w-[18ch] text-balance text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-h2">
                Des collectifs qui portent leur identité.
              </h2>
            </div>
            <p className="max-w-[40ch] text-[15px] leading-[1.6] text-fog">
              Chaque pièce est dessinée sur-mesure — vos couleurs, votre blason, votre style.
            </p>
          </div>
        </Reveal>

        {/* Collection mise en avant : les trois tenues d'un même club */}
        <Reveal className="mt-16 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-label text-green-light">
              {featuredCollection.season}
            </div>
            <h3 className="mt-2 text-[24px] font-extrabold tracking-tight">
              {featuredCollection.club}
            </h3>
          </div>
          <p className="max-w-[44ch] text-[14px] leading-[1.6] text-mute-ink">
            {featuredCollection.intro}
          </p>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCollection.pieces.map((piece, index) => (
            <Reveal as="figure" key={piece.id} delay={index * 90} className="group m-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line-dark bg-ink-deep transition-colors duration-200 group-hover:border-green/50">
                <Image
                  src={piece.image}
                  alt={piece.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(17,20,22,0.85))]"
                />
                <figcaption className="absolute bottom-4 left-5 text-[15px] font-bold tracking-tight text-white">
                  {piece.label}
                </figcaption>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Autres réalisations */}
        <Reveal className="mt-20">
          <h3 className="text-[11px] font-semibold uppercase tracking-label text-mute-ink">
            Autres collectifs
          </h3>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realisations.map((item, index) => (
            <Reveal as="article" key={item.id} delay={(index % 3) * 90}>
              <div className="group h-full overflow-hidden rounded-xl border border-line-dark bg-surface-dark transition-all duration-200 hover:-translate-y-1 hover:border-green/50 hover:shadow-immersive">
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-deep">
                  <Image
                    src={item.image}
                    alt={`${item.team} — ${item.sport}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(17,20,22,0.55)_100%)]"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold">{item.team}</div>
                    <div className="mt-0.5 text-[12px] text-mute-ink">{item.sport}</div>
                  </div>
                  <span className="flex-none rounded-pill border border-green px-3 py-1 text-[11px] font-semibold tracking-link text-green-light">
                    {item.technique}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Shell>
    </section>
  );
}

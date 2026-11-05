import Image from "next/image";
import {
  littoralCollections,
  otherRealisations,
  partnerClub,
  type KitCollection,
} from "@/lib/site-content";
import { CollectionTabs } from "./CollectionTabs";
import { cn } from "@/lib/cn";
import { Eyebrow, Shell } from "./Shell";
import { MythPattern } from "./MythPattern";
import { Reveal } from "./Reveal";
import { ZoomableImage } from "./ZoomableImage";

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
                Un club, trois tenues, une signature.
              </h2>
            </div>
            <p className="max-w-[40ch] text-[15px] leading-[1.6] text-fog">
              Chaque pièce est dessinée sur-mesure — vos couleurs, votre blason, votre style.
            </p>
          </div>
        </Reveal>

        {/* Bandeau club partenaire */}
        <Reveal className="mt-12">
          <div className="rounded-2xl border border-line-dark bg-surface-dark/60 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
              <div className="flex items-center gap-4">
                {partnerClub.crest ? (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-immersive">
                    <Image
                      src={partnerClub.crest}
                      alt={`Blason ${partnerClub.name}`}
                      width={64}
                      height={64}
                      className="h-full w-full object-contain"
                    />
                  </span>
                ) : null}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-label text-green-light">
                    Club partenaire
                  </div>
                  <div className="mt-1 text-[22px] font-extrabold tracking-tight">{partnerClub.name}</div>
                  <div className="mt-0.5 text-[12px] text-mute-ink">
                    Depuis {partnerClub.since} · {partnerClub.role} Lemnos
                  </div>
                </div>
              </div>
              <p className="max-w-[46ch] text-[14px] leading-[1.65] text-fog md:ml-auto md:text-right">
                {partnerClub.partnership}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Les collections du club — un onglet par collection (extérieur, domicile…) */}
        <Reveal className="mt-14">
          <CollectionTabs
            tabs={littoralCollections.map(({ id, label, isNew }) => ({ id, label, isNew }))}
            panels={littoralCollections.map((collection) => (
              <CollectionPanel key={collection.id} collection={collection} />
            ))}
          />
        </Reveal>

        {/* Autres réalisations — clubs équipés par Lemnos (masqué si la liste est vide) */}
        {otherRealisations.length > 0 && (
          <>
            <Reveal className="mt-20">
              <h3 className="text-[11px] font-semibold uppercase tracking-label text-mute-ink">
                Ils nous ont fait confiance
              </h3>
            </Reveal>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherRealisations.map((realisation, index) => (
                <Reveal as="article" key={realisation.id} delay={(index % 3) * 90}>
                  <div className="h-full overflow-hidden rounded-xl border border-line-dark bg-surface-dark transition-all duration-200 hover:-translate-y-1 hover:border-green/50 hover:shadow-immersive">
                    <ZoomableImage
                      src={realisation.image}
                      alt={realisation.alt}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="aspect-[5/4] bg-black"
                    >
                      {realisation.partner ? (
                        <span className="absolute left-3 top-3 rounded-pill bg-green px-3 py-1 text-[11px] font-semibold tracking-link text-white">
                          Partenaire
                        </span>
                      ) : null}
                    </ZoomableImage>
                    <div className="flex items-center justify-between gap-3 p-5">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold">{realisation.club}</div>
                        <div className="mt-0.5 text-[12px] text-mute-ink">{realisation.kit}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </Shell>
    </section>
  );
}

/** Une collection : en-tête, tenues face / dos, puis galerie en conditions réelles. */
function CollectionPanel({ collection }: { collection: KitCollection }) {
  const { kits, cover, gallery } = collection;
  const showCover = cover && kits.length % 2 === 1;
  const oddGallery = gallery.length % 2 === 1;

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-label text-green-light">
            {collection.season}
          </div>
          <h3 className="mt-2 text-[24px] font-extrabold tracking-tight">Les tenues</h3>
        </div>
        <p className="max-w-[42ch] text-[14px] leading-[1.6] text-mute-ink">{collection.intro}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {kits.map((kit) => (
          <article
            key={kit.id}
            className="rounded-2xl border border-line-dark bg-surface-dark/40 p-4 md:p-5"
          >
            <div className="grid grid-cols-2 gap-3">
              {kit.views.map((view) => (
                <figure key={view.id} className="m-0">
                  <ZoomableImage
                    src={view.image}
                    alt={view.alt}
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="aspect-[3/4] rounded-xl border border-line-dark bg-black transition-colors duration-200 hover:border-green/50"
                  >
                    <span className="absolute bottom-3 left-3 rounded-pill bg-ink/80 px-3 py-1 text-[11px] font-bold tracking-tight text-white backdrop-blur-sm">
                      {view.label}
                    </span>
                  </ZoomableImage>
                </figure>
              ))}
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 px-1">
              <div>
                <h4 className="text-[16px] font-bold tracking-tight">{kit.name}</h4>
                <p className="mt-1.5 max-w-[38ch] text-[13px] leading-[1.6] text-mute-ink">{kit.blurb}</p>
              </div>
              <span className="shrink-0 rounded-pill border border-green/40 px-3 py-1 text-[11px] font-semibold tracking-link text-green-light">
                {kit.role}
              </span>
            </div>
          </article>
        ))}

        {showCover ? (
          <figure className="m-0">
            <ZoomableImage
              src={cover.image}
              alt={cover.alt}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[4/5] rounded-2xl border border-line-dark bg-black transition-colors duration-200 hover:border-green/50 lg:aspect-auto lg:h-full"
            />
          </figure>
        ) : null}
      </div>

      {/* En conditions réelles — galerie secondaire */}
      <h3 className="mt-20 text-[11px] font-semibold uppercase tracking-label text-mute-ink">
        En conditions réelles
      </h3>

      <div
        className={cn(
          "mt-6 grid grid-cols-2 gap-4",
          gallery.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {gallery.map((shot, index) => (
          <figure
            key={shot.id}
            className={cn("m-0", oddGallery && index === 0 && "col-span-2 lg:col-span-1")}
          >
            <ZoomableImage
              src={shot.image}
              alt={shot.alt}
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="aspect-[4/5] rounded-xl border border-line-dark bg-black transition-colors duration-200 hover:border-green/50"
            />
          </figure>
        ))}
      </div>
    </>
  );
}

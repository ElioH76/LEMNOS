import Image from "next/image";
import { realisations } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

export function RealisationsSection() {
  return (
    <section id="realisations" className="scroll-mt-24 bg-ink py-24 text-white md:py-28">
      <Shell>
        <Eyebrow tone="dark">Réalisations</Eyebrow>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-[18ch] text-balance text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-h2">
            Des collectifs qui portent leur identité.
          </h2>
          <p className="max-w-[40ch] text-[15px] leading-[1.6] text-fog">
            Chaque pièce est dessinée sur-mesure — vos couleurs, votre blason, votre style.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realisations.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-xl border border-line-dark bg-surface-dark transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-deep">
                <Image
                  src={item.image}
                  alt={`${item.team} — ${item.sport}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
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
            </article>
          ))}
        </div>
      </Shell>
    </section>
  );
}

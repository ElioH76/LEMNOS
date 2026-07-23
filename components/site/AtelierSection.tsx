import { features, techniques } from "@/lib/site-content";
import { Mark } from "@/components/brand/Mark";
import { Eyebrow, Shell } from "./Shell";
import { Reveal } from "./Reveal";

export function AtelierSection() {
  return (
    <section id="atelier" className="relative scroll-mt-24 overflow-hidden bg-white py-24 md:py-28">
      <div aria-hidden className="dots-on-light absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />
      <Mark
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 w-[360px] text-ink/[0.03]"
      />

      <Shell className="relative">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal>
            <Eyebrow>L&apos;atelier</Eyebrow>
            <h2 className="mt-5 max-w-[14ch] text-balance text-[34px] font-extrabold leading-[1.05] tracking-tight md:text-[42px]">
              Un savoir-faire, <span className="font-serif font-bold text-green">forgé</span> pièce
              par pièce.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.65] text-slate">
              La rigueur d&apos;une agence, la chaleur d&apos;un seul contact. De l&apos;idée au
              maillot, nous façonnons chaque commande dans notre atelier — jamais un template, jamais
              deux équipes identiques.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {techniques.map((technique, index) => (
                <span
                  key={technique}
                  className={
                    index === techniques.length - 1
                      ? "rounded-pill bg-green px-3.5 py-1.5 text-[11.5px] font-semibold tracking-link text-white"
                      : "rounded-pill border border-green px-3.5 py-1.5 text-[11.5px] font-semibold tracking-link text-green"
                  }
                >
                  {technique}
                </span>
              ))}
            </div>
          </Reveal>

          <ul className="flex flex-col divide-y divide-line">
            {features.map((feature, index) => (
              <Reveal as="li" key={feature.title} delay={index * 90} className="flex gap-5 py-6 first:pt-0">
                <span className="text-[15px] font-extrabold leading-none text-green">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-bold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-stone">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Shell>
    </section>
  );
}

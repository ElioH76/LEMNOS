import Image from "next/image";
import { methodSteps } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

/** « Du croquis au terrain » : la méthode Lemnos, illustrée par une vraie photo portée. */
export function MethodSection() {
  return (
    <section id="methode" className="scroll-mt-20 border-b border-night-line">
      <Shell className="grid grid-cols-1 gap-12 py-20 md:py-24 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="relative h-[420px] overflow-hidden bg-ink md:h-[560px] lg:h-auto lg:min-h-[560px]">
          <Image
            src="/images/creations/fc-littoral/domicile/porte-detail.jpg"
            alt="Détail d'un maillot Lemnos porté — blason du club et emblème Lemnos"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center gap-10">
          <div className="flex flex-col gap-[18px]">
            <Eyebrow>La méthode</Eyebrow>
            <h2 className="font-serif text-[40px] font-bold leading-none text-white md:text-[52px]">
              Du croquis au terrain.
            </h2>
            <p className="max-w-[48ch] text-[16px] leading-[1.6] text-fog">
              Un seul interlocuteur suit votre projet de la première idée à la livraison. Vous
              validez chaque étape avant la suivante.
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {methodSteps.map((step) => (
              <li key={step.n} className="flex flex-col gap-2 border-t border-night-line pt-5">
                <span className="text-[12px] font-bold tracking-label text-mint">{step.n}</span>
                <span className="text-[18px] font-bold text-white">{step.title}</span>
                <span className="text-[15px] leading-[1.55] text-pearl">{step.desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </Shell>
    </section>
  );
}

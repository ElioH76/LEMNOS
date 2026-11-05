import Image from "next/image";
import { lookbookKits, methodSteps } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

const TAG =
  "absolute left-3 top-3 z-10 rounded-sharp bg-ink-deep px-2.5 py-1 text-[11px] font-bold uppercase tracking-label text-white";

/** « Du croquis au terrain » : la méthode Lemnos, illustrée par une maquette réelle et sa tenue portée. */
export function MethodSection() {
  const { mockup, gallery } = lookbookKits.ext;
  const worn = gallery[0];

  return (
    <section id="methode" className="scroll-mt-20 border-b border-night-line">
      <Shell className="grid grid-cols-1 gap-12 py-20 md:py-24 lg:grid-cols-[5fr_7fr] lg:gap-16">
        {/* La preuve de la méthode : la planche dessinée, puis le maillot porté. */}
        <figure className="order-2 flex flex-col gap-1 lg:order-1">
          <div className="relative bg-white px-5 pb-6 pt-11 md:px-8">
            <figcaption className={TAG}>Maquette</figcaption>
            <Image
              src={mockup.image}
              alt={mockup.alt}
              width={mockup.width}
              height={mockup.height}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-auto w-full"
            />
          </div>
          <div className="relative h-[340px] overflow-hidden bg-ink md:h-[420px]">
            <span className={TAG}>Sur le terrain</span>
            <Image
              src={worn.image}
              alt={worn.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-[50%_35%]"
            />
          </div>
        </figure>

        <div className="order-1 flex flex-col justify-center gap-10 lg:order-2">
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

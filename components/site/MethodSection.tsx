import { Compass, Factory, PenTool, Shirt, Truck, type LucideIcon } from "lucide-react";
import { Mark } from "@/components/brand/Mark";
import { methodSteps } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";
import { Reveal } from "./Reveal";

const ICONS: LucideIcon[] = [Compass, PenTool, Shirt, Factory, Truck];

export function MethodSection() {
  return (
    <section id="methode" className="relative scroll-mt-24 overflow-hidden bg-paper py-24 md:py-28">
      {/* textures de fond discrètes */}
      <div aria-hidden className="dots-on-light absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />
      <Mark
        aria-hidden
        className="pointer-events-none absolute -right-16 top-10 w-[340px] text-ink/[0.03]"
      />

      <Shell className="relative">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <Eyebrow>La méthode</Eyebrow>
              <h2 className="mt-5 max-w-[16ch] text-balance text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-h2">
                Cinq étapes, un seul interlocuteur.
              </h2>
            </div>
            <p className="max-w-[42ch] text-[15px] leading-[1.6] text-slate">
              Du croquis à la livraison, vous validez à chaque étape — nous exécutons le reste, sans
              jamais vous laisser gérer la complexité.
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {methodSteps.map((step, index) => {
            const Icon = ICONS[index];
            return (
              <Reveal as="li" key={step.n} delay={index * 90}>
                <div className="group relative flex h-full min-h-[248px] flex-col overflow-hidden rounded-xl border border-line bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-green/40 hover:shadow-card-hover">
                  <span className="pointer-events-none absolute -right-1 top-1 text-[56px] font-extrabold leading-none tracking-tighter text-ink/[0.05] tabular-nums">
                    {step.n}
                  </span>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-green-soft text-green transition-colors duration-200 group-hover:bg-green group-hover:text-white">
                    <Icon size={20} strokeWidth={1.8} aria-hidden />
                  </span>
                  <h3 className="relative mt-6 text-[15px] font-bold tracking-tight">{step.title}</h3>
                  <p className="relative mt-2 text-[13px] leading-[1.55] text-stone">{step.desc}</p>
                  <span
                    aria-hidden
                    className="relative mt-auto block h-[2px] w-8 bg-green transition-all duration-300 group-hover:w-16"
                  />
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Shell>
    </section>
  );
}

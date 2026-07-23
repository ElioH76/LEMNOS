import { methodSteps } from "@/lib/site-content";
import { Eyebrow, Shell } from "./Shell";

export function MethodSection() {
  return (
    <section id="methode" className="scroll-mt-24 bg-white py-24 md:py-28">
      <Shell>
        <Eyebrow>La méthode</Eyebrow>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-[16ch] text-balance text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-h2">
            Notre méthode en cinq étapes.
          </h2>
          <p className="max-w-[42ch] text-[15px] leading-[1.6] text-slate">
            Un seul interlocuteur, du croquis à la livraison. Vous validez, on exécute — sans jamais
            gérer la complexité.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {methodSteps.map((step) => (
            <li
              key={step.n}
              className="group flex min-h-[220px] flex-col bg-white p-7 transition-colors hover:bg-paper-soft"
            >
              <span className="text-[22px] font-extrabold leading-none text-green">{step.n}</span>
              <h3 className="mt-6 text-[15px] font-bold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-stone">{step.desc}</p>
            </li>
          ))}
        </ol>
      </Shell>
    </section>
  );
}

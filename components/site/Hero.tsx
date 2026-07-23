import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { heroImage } from "@/lib/site-content";
import { Shell } from "./Shell";

export function Hero() {
  return (
    <header id="top" className="relative isolate flex min-h-[92vh] items-end overflow-hidden bg-ink-deep">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* halo vert discret par-dessus la photo, direction photo DA */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_75%_15%,rgba(30,91,60,0.30),transparent_55%)]" />
        {/* dégradé de lisibilité repris de la maquette DA */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,20,22,0.72)_0%,rgba(17,20,22,0.38)_34%,rgba(17,20,22,0.55)_72%,rgba(17,20,22,0.96)_100%)]" />
      </div>

      <Shell className="pb-20 pt-32 md:pb-28">
        <div className="text-[13px] font-medium uppercase tracking-hero text-green-light">
          VÊTEMENTS DE SPORT PERSONNALISÉS
        </div>

        <h1 className="mt-5 max-w-[15ch] text-balance text-[44px] font-extrabold leading-[0.98] tracking-tight text-white sm:text-[56px] lg:text-display">
          Vos idées,{" "}
          <span className="font-serif font-bold tracking-[0.005em]">forgées</span> en équipement.
        </h1>

        <p className="mt-6 max-w-[52ch] text-base leading-[1.6] text-fog md:text-[16.5px]">
          Un seul interlocuteur, du croquis à la livraison. On dessine, on prototype, on produit —
          vous validez à chaque étape.
        </p>

        <div className="mt-8 flex flex-wrap gap-3.5">
          <a href="#projet">
            <Button variant="primary">Démarrer un projet</Button>
          </a>
          <a href="#methode">
            <Button variant="outline-light">Voir la méthode</Button>
          </a>
        </div>
      </Shell>
    </header>
  );
}

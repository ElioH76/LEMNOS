import type { Metadata } from "next";
import { LegalH2, LegalLayout, LegalP } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Mentions légales — Lemnos",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <LegalH2>Éditeur du site</LegalH2>
      <LegalP>
        {`Le présent site est édité par :

LEMNOS — Micro-entreprise
Entrepreneur individuel : Elio HARDOUIN
SIRET : 10805824900013

18 rue Champlain
76600 Le Havre
France`}
      </LegalP>
      <LegalP>
        E-mail :{" "}
        <a href="mailto:contact@lemnos-sportswear.fr" className="text-green hover:underline">
          contact@lemnos-sportswear.fr
        </a>
      </LegalP>
      <LegalP>Directeur de la publication : Elio HARDOUIN</LegalP>

      <LegalH2>Hébergement</LegalH2>
      <LegalP>
        {`Le site est hébergé par :

Vercel Inc.
440 N Barranca Ave #4133
Covina, CA 91723
États-Unis`}
      </LegalP>

      <LegalH2>Propriété intellectuelle</LegalH2>
      <LegalP>
        L&apos;ensemble des éléments présents sur le site (textes, photographies, illustrations,
        logos, graphismes, vidéos, éléments visuels, design et identité graphique) est protégé par
        les dispositions du Code de la propriété intellectuelle.
      </LegalP>
      <LegalP>
        Toute reproduction, représentation, adaptation, modification, publication ou exploitation,
        totale ou partielle, sans autorisation écrite préalable de LEMNOS est interdite.
      </LegalP>

      <LegalH2>Responsabilité</LegalH2>
      <LegalP>
        LEMNOS met tout en œuvre afin d&apos;assurer l&apos;exactitude des informations publiées sur
        ce site. Toutefois, l&apos;éditeur ne saurait être tenu responsable des éventuelles erreurs,
        omissions ou indisponibilités temporaires du site.
      </LegalP>

      <LegalH2>Contact</LegalH2>
      <LegalP>
        Pour toute question :{" "}
        <a href="mailto:contact@lemnos-sportswear.fr" className="text-green hover:underline">
          contact@lemnos-sportswear.fr
        </a>
      </LegalP>
    </LegalLayout>
  );
}

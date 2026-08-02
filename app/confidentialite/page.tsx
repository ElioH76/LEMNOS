import type { Metadata } from "next";
import { LegalH2, LegalLayout, LegalList, LegalP } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Lemnos",
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <LegalH2>1. Responsable du traitement</LegalH2>
      <LegalP>
        {`Le responsable du traitement des données est :

LEMNOS
18 rue Champlain
76600 Le Havre`}
      </LegalP>
      <LegalP>
        <a href="mailto:contact@lemnos-sportswear.fr" className="text-green hover:underline">
          contact@lemnos-sportswear.fr
        </a>
      </LegalP>

      <LegalH2>2. Données collectées</LegalH2>
      <LegalP>
        Lorsque vous utilisez le formulaire de contact, les données suivantes peuvent être
        collectées :
      </LegalP>
      <LegalList
        items={[
          "Nom",
          "Adresse e-mail",
          "Nom du club ou de l'organisation (si renseigné)",
          "Contenu du message",
        ]}
      />
      <LegalP>Aucune donnée bancaire n&apos;est collectée sur ce site.</LegalP>

      <LegalH2>3. Finalité</LegalH2>
      <LegalP>Les données sont utilisées uniquement pour :</LegalP>
      <LegalList
        items={[
          "répondre à votre demande ;",
          "échanger au sujet de votre projet ;",
          "établir un devis si vous en faites la demande.",
        ]}
      />
      <LegalP>
        Elles ne sont jamais revendues ni transmises à des tiers à des fins commerciales.
      </LegalP>

      <LegalH2>4. Durée de conservation</LegalH2>
      <LegalP>
        Les données sont conservées uniquement pendant la durée nécessaire au traitement de votre
        demande et aux obligations légales éventuelles.
      </LegalP>

      <LegalH2>5. Vos droits</LegalH2>
      <LegalP>Conformément au RGPD, vous disposez d&apos;un droit :</LegalP>
      <LegalList
        items={[
          "d'accès ;",
          "de rectification ;",
          "d'effacement ;",
          "d'opposition ;",
          "de limitation du traitement.",
        ]}
      />
      <LegalP>
        Toute demande peut être adressée à :{" "}
        <a href="mailto:contact@lemnos-sportswear.fr" className="text-green hover:underline">
          contact@lemnos-sportswear.fr
        </a>
      </LegalP>

      <LegalH2>6. Cookies</LegalH2>
      <LegalP>
        Le site peut utiliser des cookies techniques nécessaires à son bon fonctionnement. Aucun
        cookie publicitaire n&apos;est utilisé. Si un outil de mesure d&apos;audience est ajouté
        ultérieurement, cette politique sera mise à jour.
      </LegalP>
    </LegalLayout>
  );
}

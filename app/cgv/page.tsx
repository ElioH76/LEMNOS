import type { Metadata } from "next";
import { LegalH2, LegalLayout, LegalP } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Lemnos",
};

export default function CgvPage() {
  return (
    <LegalLayout title="Conditions générales de vente">
      <LegalH2>Article 1 — Objet</LegalH2>
      <LegalP>
        Les présentes Conditions Générales de Vente régissent les prestations proposées par LEMNOS.
        LEMNOS conçoit et commercialise des équipements sportifs personnalisés destinés notamment aux
        clubs sportifs, associations, collectivités et entreprises.
      </LegalP>

      <LegalH2>Article 2 — Commande</LegalH2>
      <LegalP>
        Toute commande fait l&apos;objet d&apos;un devis préalable. La commande devient définitive
        uniquement après acceptation du devis par le client.
      </LegalP>

      <LegalH2>Article 3 — Personnalisation</LegalH2>
      <LegalP>
        Les produits étant réalisés sur mesure, le client est responsable de la validation finale des
        maquettes avant lancement en production. Aucune modification ne pourra être demandée après
        validation.
      </LegalP>

      <LegalH2>Article 4 — Prix</LegalH2>
      <LegalP>
        {`Les prix sont exprimés en euros.
LEMNOS est une micro-entreprise bénéficiant de la franchise en base de TVA.
TVA non applicable — article 293 B du CGI.`}
      </LegalP>

      <LegalH2>Article 5 — Paiement</LegalH2>
      <LegalP>
        Les modalités de paiement sont précisées sur le devis. La production peut débuter après
        réception de l&apos;acompte lorsqu&apos;il est prévu.
      </LegalP>

      <LegalH2>Article 6 — Délais</LegalH2>
      <LegalP>
        Les délais sont communiqués à titre indicatif. LEMNOS ne pourra être tenue responsable
        d&apos;un retard indépendant de sa volonté (transporteur, fabricant, douanes, force
        majeure…).
      </LegalP>

      <LegalH2>Article 7 — Livraison</LegalH2>
      <LegalP>
        Les produits sont livrés à l&apos;adresse communiquée par le client. Le client doit vérifier
        les produits à réception et signaler toute anomalie dans un délai raisonnable.
      </LegalP>

      <LegalH2>Article 8 — Produits personnalisés</LegalH2>
      <LegalP>
        Conformément à l&apos;article L221-28 du Code de la consommation, les produits réalisés selon
        les spécifications du client ou nettement personnalisés ne bénéficient pas du droit de
        rétractation.
      </LegalP>

      <LegalH2>Article 9 — Propriété intellectuelle</LegalH2>
      <LegalP>
        Les créations graphiques réalisées par LEMNOS demeurent sa propriété intellectuelle
        jusqu&apos;au paiement intégral de la commande, sauf accord contraire.
      </LegalP>

      <LegalH2>Article 10 — Droit applicable</LegalH2>
      <LegalP>
        Les présentes CGV sont soumises au droit français. En cas de litige, les parties
        rechercheront une solution amiable avant toute procédure judiciaire.
      </LegalP>
    </LegalLayout>
  );
}

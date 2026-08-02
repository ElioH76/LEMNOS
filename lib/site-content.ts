/**
 * Contenu éditorial de la landing — nouvelle DA Lemnos.
 * Typé et isolé pour qu'un CMS puisse le remplacer sans toucher aux composants.
 */

import { siteConfig } from "./site-config";

export interface NavLink {
  label: string;
  href: string;
}

export interface MethodStep {
  n: string;
  title: string;
  desc: string;
}

/** Réalisation pour un autre club : un mockup de tenue complet. */
export interface ClubShowcase {
  id: string;
  team: string;
  kit: string;
  image: string;
  alt: string;
}

export interface Feature {
  title: string;
  desc: string;
}

/** Une pièce d'une collection complète (domicile / extérieur / third). */
export interface KitPiece {
  id: string;
  label: string;
  image: string;
  alt: string;
}

/** Collection mise en avant : les trois tenues d'un même club. */
export const featuredCollection = {
  club: "F.C. Littoral",
  season: "Collection 2026",
  intro:
    "Trois tenues, une seule identité : le héron du littoral, décliné du domicile au third.",
  pieces: [
    {
      id: "domicile",
      label: "Domicile",
      image: "/images/creations/mockup-fclittoral-domicile-LEMNOS.png",
      alt: "Tenue domicile F.C. Littoral — jaune et vert, blason au héron, conçue par Lemnos",
    },
    {
      id: "exterieur",
      label: "Extérieur",
      image: "/images/creations/mockup-fclittoral-exterieur-LEMNOS.png",
      alt: "Tenue extérieur F.C. Littoral — vert profond et liseré or, conçue par Lemnos",
    },
    {
      id: "third",
      label: "Third",
      image: "/images/creations/mockup-fclittoral-third-LEMNOS.png",
      alt: "Tenue third F.C. Littoral — blanche à liseré violet, héron en filigrane, conçue par Lemnos",
    },
  ] satisfies KitPiece[],
};

export const navLinks: NavLink[] = [
  { label: "Méthode", href: "#methode" },
  // Masquée tant que `siteConfig.showRealisations` est false (nav + footer).
  ...(siteConfig.showRealisations
    ? [{ label: "Réalisations", href: "#realisations" }]
    : []),
  { label: "Atelier", href: "#atelier" },
];

/** Techniques de personnalisation proposées à l'atelier. */
export const techniques = ["Broderie", "Sublimation", "Flocage"];

export const clients = [
  "FC Rivière",
  "Lycée Ampère",
  "Novastudio",
  "BDE Skema",
  "Titans e-Sport",
  "RC Vallon",
];

export const methodSteps: MethodStep[] = [
  {
    n: "01",
    title: "Conception",
    desc: "On traduit votre brief en croquis et maquettes précises.",
  },
  {
    n: "02",
    title: "Design",
    desc: "Notre studio met votre identité en forme, jusqu'à validation.",
  },
  {
    n: "03",
    title: "Prototype",
    desc: "Vous recevez un échantillon réel avant tout lancement.",
  },
  {
    n: "04",
    title: "Production",
    desc: "Fabrication contrôlée à chaque étape par nos soins.",
  },
  {
    n: "05",
    title: "Livraison",
    desc: "Vos équipements arrivent prêts à porter, dans les délais.",
  },
];

/** Autres clubs équipés par Lemnos. */
export const otherClubs: ClubShowcase[] = [
  {
    id: "ocfc",
    team: "Olympia Caux FC",
    kit: "Domicile · noir & or",
    image: "/images/creations/mockup-OCFC-LEMNOS.png",
    alt: "Tenue Olympia Caux Football Club — noire et or, motif phénix, conçue par Lemnos",
  },
  {
    id: "rolleville",
    team: "FC Rolleville",
    kit: "Extérieur · blanc, marine & or",
    image: "/images/creations/mockup-fcrolleville-white-LEMNOS-.png",
    alt: "Tenue FC Rolleville — blanche, bleu marine et or, conçue par Lemnos",
  },
  {
    id: "epouville",
    team: "US Épouville",
    kit: "Extérieur · blanc, bleu & rouge",
    image: "/images/creations/mockup-usepouville-exterieur-LEMNOS.png",
    alt: "Tenue extérieur US Épouville — blanche à liserés bleu et rouge, motif gecko, conçue par Lemnos",
  },
];

/**
 * Visuel plein cadre du hero — direction photo cinématographique sombre.
 * Équipe en maillots LEMNOS (emblème + wordmark), ambiance industrielle sombre.
 */
export const heroImage = "/images/hero-team.jpg";
/** Packshot du prototype mis en avant dans l'espace client. */
export const protoImage = "/images/proto.jpg";

export const features: Feature[] = [
  {
    title: "Un seul interlocuteur",
    desc: "Une personne dédiée vous suit de la première idée à la livraison. Pas de service client anonyme.",
  },
  {
    title: "Prototype avant production",
    desc: "Vous validez un échantillon réel avant tout lancement. Ce que vous voyez est ce que vous recevez.",
  },
  {
    title: "Trois techniques maîtrisées",
    desc: "Broderie, sublimation, flocage — la finition juste pour chaque pièce, forgée dans notre atelier.",
  },
];

export const promises = [
  "Réponse sous 24 h",
  "Devis clair, sans surprise",
  "Prototype avant production",
];

export const structureTypes = [
  "Club de sport",
  "Entreprise",
  "École / BDE",
  "Équipe e-sport",
  "Association / collectivité",
];

export const contactEmail = "contact@lemnos-sportswear.fr";

/** Lien Instagram (footer + page d'attente), configurable via l'env Vercel. */
export const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/";

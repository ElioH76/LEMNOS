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

export interface Feature {
  title: string;
  desc: string;
}

/** Une vue d'une tenue photographiée (face ou dos). */
export interface KitView {
  id: string;
  label: string;
  image: string;
  alt: string;
}

/** Une tenue du club partenaire, présentée en packshots face + dos. */
export interface Kit {
  id: string;
  name: string;
  role: string;
  blurb: string;
  views: KitView[];
}

/**
 * Club partenaire mis en avant dans les réalisations. Lemnos équipe le club
 * (tenues offertes contre visibilité) : c'est notre première vitrine réelle.
 */
export const partnerClub = {
  name: "F.C. Littoral",
  since: "2002",
  role: "Équipementier officiel",
  season: "Collection 2026 · Domicile",
  intro:
    "Notre premier club partenaire. Lemnos signe l'intégralité de ses tenues 2026 — du maillot joueur au maillot gardien.",
  partnership:
    "Lemnos équipe le F.C. Littoral : maillots dessinés, prototypés et produits sur-mesure, portés sur le terrain toute la saison.",
  /**
   * Blason du club (PNG/SVG à fond transparent). Déposer le fichier à ce chemin
   * pour afficher le blason dans le bandeau partenaire ; laisser `null` sinon.
   */
  crest: null as string | null,
};

/** Les tenues du F.C. Littoral — le cœur de la vitrine, en packshots. */
export const littoralKits: Kit[] = [
  {
    id: "domicile",
    name: "Maillot domicile",
    role: "Joueur",
    blurb:
      "Jaune héron, col et coutures vert bouteille. Emblème Lemnos au cœur, blason du club en poitrine, flocage ton sur ton.",
    views: [
      {
        id: "face",
        label: "Face",
        image: "/images/creations/fc-littoral/domicile-face.jpg",
        alt: "Maillot domicile joueur du F.C. Littoral par Lemnos — jaune à liserés verts, emblème Lemnos et blason du club, vue de face",
      },
      {
        id: "dos",
        label: "Dos",
        image: "/images/creations/fc-littoral/domicile-dos.jpg",
        alt: "Dos du maillot domicile F.C. Littoral par Lemnos — flocage « FC LITTORAL » et numéro 10 vert",
      },
    ],
  },
  {
    id: "gardien",
    name: "Maillot gardien",
    role: "Gardien",
    blurb:
      "Camouflage violet, manches longues. Même signature Lemnos, contraste total avec la tenue joueur pour se démarquer sur le terrain.",
    views: [
      {
        id: "face",
        label: "Face",
        image: "/images/creations/fc-littoral/gardien-face.jpg",
        alt: "Maillot gardien du F.C. Littoral par Lemnos — camouflage violet, emblème Lemnos et blason du club, vue de face",
      },
      {
        id: "dos",
        label: "Dos",
        image: "/images/creations/fc-littoral/gardien-dos.jpg",
        alt: "Dos du maillot gardien F.C. Littoral par Lemnos — camouflage violet, « FC LITTORAL » et numéro 1 blancs",
      },
    ],
  },
];

/**
 * Réalisation « secondaire » : un club équipé par Lemnos — un *client* (pas
 * forcément partenaire), présenté en carte compacte (1 visuel + nom + tenue).
 * Le bloc « Ils nous ont fait confiance » n'apparaît sur le site que si la
 * liste contient au moins une entrée → pas de galerie vide au lancement.
 * Ajouter un club = une entrée + une image dans public/images/creations/.
 */
export interface Realisation {
  id: string;
  club: string;
  kit: string;
  image: string;
  alt: string;
  /** true = badge « Partenaire » (réservé aux clubs partenaires, ex. FC Littoral). */
  partner?: boolean;
}

export const otherRealisations: Realisation[] = [
  // Ajouter ici les futurs clubs équipés (clients, pas forcément partenaires).
  // Tant que la liste est vide, le bloc « Ils nous ont fait confiance » est masqué.
];

/** Le partenariat en conditions réelles — galerie secondaire. */
export const littoralGallery: { id: string; image: string; alt: string }[] = [
  {
    id: "equipe",
    image: "/images/creations/fc-littoral/equipe.jpg",
    alt: "L'équipe du F.C. Littoral en tenue Lemnos, devant les buts",
  },
  {
    id: "signature",
    image: "/images/creations/fc-littoral/signature-dos.jpg",
    alt: "Signature Lemnos au bas du dos des maillots F.C. Littoral",
  },
  {
    id: "detail",
    image: "/images/creations/fc-littoral/porte-detail.jpg",
    alt: "Détail du maillot domicile F.C. Littoral porté — blason du club et emblème Lemnos",
  },
  {
    id: "soleil",
    image: "/images/creations/fc-littoral/porte-soleil.jpg",
    alt: "Dos d'un maillot F.C. Littoral porté à contre-jour — flocage numéro 4",
  },
];

// Ancres absolues (`/#…`) pour que la nav et le footer fonctionnent aussi
// depuis les pages légales, pas seulement depuis l'accueil.
export const navLinks: NavLink[] = [
  { label: "Méthode", href: "/#methode" },
  // Masquée tant que `siteConfig.showRealisations` est false (nav + footer).
  ...(siteConfig.showRealisations
    ? [{ label: "Réalisations", href: "/#realisations" }]
    : []),
  { label: "Atelier", href: "/#atelier" },
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

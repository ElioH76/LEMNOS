/**
 * Contenu éditorial de la landing — piste « Lookbook ».
 * Typé et isolé pour qu'un CMS puisse le remplacer sans toucher aux composants.
 *
 * Règle : uniquement les vraies photos du shooting F.C. Littoral, jamais
 * d'images générées.
 */

export type KitId = "dom" | "ext" | "gar";

export interface LookbookShot {
  image: string;
  alt: string;
}

export interface LookbookSpec {
  label: string;
  value: string;
}

/** Une tenue de la collection : texte du hero, galerie 3 photos, caractéristiques. */
export interface LookbookKit {
  id: KitId;
  name: string;
  desc: string;
  gallery: [LookbookShot, LookbookShot, LookbookShot];
  specs: LookbookSpec[];
}

/** Une slide du carrousel hero, rattachée à une tenue. */
export interface LookbookSlide {
  kit: KitId;
  image: string;
  alt: string;
  /** object-position du cadrage. */
  position: string;
}

const DOM = "/images/creations/fc-littoral/domicile";
const EXT = "/images/creations/fc-littoral/exterieur";

export const collectionLabel = "Collection F.C. Littoral · 2026";

export const lookbookKits: Record<KitId, LookbookKit> = {
  dom: {
    id: "dom",
    name: "Domicile",
    desc: "Jaune héron et vert bouteille, emblème Lemnos au cœur, blason du club en poitrine.",
    gallery: [
      {
        image: `${DOM}/domicile-face.jpg`,
        alt: "Maillot domicile du F.C. Littoral par Lemnos — jaune à liserés verts, vue de face",
      },
      {
        image: `${DOM}/domicile-dos.jpg`,
        alt: "Dos du maillot domicile F.C. Littoral — flocage « FC LITTORAL » et numéro 10 vert",
      },
      {
        image: `${DOM}/porte-detail.jpg`,
        alt: "Détail du maillot domicile porté — blason du club et emblème Lemnos",
      },
    ],
    specs: [
      { label: "Couleurs", value: "Jaune héron, col et coutures vert bouteille" },
      { label: "Marquage", value: "Emblème Lemnos au cœur, blason en poitrine" },
      { label: "Flocage", value: "Lettrage et numéros verts, ton sur ton" },
      { label: "Personnalisation", value: "Noms et numéros par joueur" },
    ],
  },
  ext: {
    id: "ext",
    name: "Extérieur",
    desc: "Col polo, manches longues, maille ajourée ton sur ton, blason au trait.",
    gallery: [
      {
        image: `${EXT}/exterieur-face.jpeg`,
        alt: "Maillot extérieur du F.C. Littoral par Lemnos porté face à la mer — noir, col polo liseré blanc",
      },
      {
        image: `${EXT}/exterieur-dos.jpeg`,
        alt: "Dos du maillot extérieur F.C. Littoral posé sur les galets — numéro 10 blanc",
      },
      {
        image: `${EXT}/equipe-grotte.jpeg`,
        alt: "Les joueurs du F.C. Littoral en maillot extérieur Lemnos, réunis sous une falaise",
      },
    ],
    specs: [
      { label: "Coupe", value: "Col polo, manches longues" },
      { label: "Matière", value: "Maille ajourée respirante" },
      { label: "Marquage", value: "Blason, sublimation ton sur ton" },
      { label: "Personnalisation", value: "Noms et numéros par joueur" },
    ],
  },
  gar: {
    id: "gar",
    name: "Gardien",
    desc: "Camouflage violet, manches longues, pour se démarquer dans la cage.",
    gallery: [
      {
        image: `${DOM}/gardien-face.jpg`,
        alt: "Maillot gardien du F.C. Littoral par Lemnos — camouflage violet, vue de face",
      },
      {
        image: `${DOM}/gardien-dos.jpg`,
        alt: "Dos du maillot gardien F.C. Littoral — « FC LITTORAL » et numéro 1 blancs",
      },
      {
        image: `${DOM}/equipe.jpg`,
        alt: "L'équipe du F.C. Littoral en tenue Lemnos, devant les buts",
      },
    ],
    specs: [
      { label: "Coupe", value: "Manches longues" },
      { label: "Motif", value: "Camouflage violet, sublimé" },
      { label: "Marquage", value: "Emblème Lemnos et blason du club" },
      { label: "Personnalisation", value: "Nom et numéro blancs" },
    ],
  },
};

export const kitOrder: KitId[] = ["dom", "ext", "gar"];

export const lookbookSlides: LookbookSlide[] = [
  {
    kit: "dom",
    image: `${DOM}/equipe.jpg`,
    alt: "L'équipe du F.C. Littoral en maillots domicile Lemnos, devant les buts",
    position: "50% 30%",
  },
  {
    kit: "dom",
    image: `${DOM}/signature-dos.jpg`,
    alt: "Signature Lemnos au bas du dos des maillots domicile F.C. Littoral",
    position: "50% 35%",
  },
  {
    kit: "ext",
    image: `${EXT}/maillot-exterieur.jpg`,
    alt: "Maillot extérieur noir du F.C. Littoral par Lemnos",
    position: "50% 45%",
  },
  {
    kit: "ext",
    image: `${EXT}/equipe-falaise.jpeg`,
    alt: "L'équipe du F.C. Littoral en maillot extérieur Lemnos, sur un rocher face à la mer",
    position: "50% 55%",
  },
  {
    kit: "gar",
    image: `${DOM}/gardien-face.jpg`,
    alt: "Gardien du F.C. Littoral en maillot camouflage violet Lemnos",
    position: "50% 62%",
  },
];

/** Packshot du prototype mis en avant dans l'espace client. */
export const protoImage = "/images/proto.jpg";

/** URL publique du site (canoniques, sitemap, Open Graph). */
export const siteUrl = "https://www.lemnos-sportswear.fr";

export const contactEmail = "contact@lemnos-sportswear.fr";

/** Lien Instagram (footer + page d'attente), configurable via l'env Vercel. */
export const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/";

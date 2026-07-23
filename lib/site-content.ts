/**
 * Contenu éditorial de la landing — nouvelle DA Lemnos.
 * Typé et isolé pour qu'un CMS puisse le remplacer sans toucher aux composants.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface MethodStep {
  n: string;
  title: string;
  desc: string;
}

export interface Realisation {
  id: string;
  team: string;
  sport: string;
  technique: string;
  image: string;
}

export interface Feature {
  title: string;
  desc: string;
}

export const navLinks: NavLink[] = [
  { label: "Méthode", href: "#methode" },
  { label: "Réalisations", href: "#realisations" },
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

export const realisations: Realisation[] = [
  {
    id: "montcerf",
    team: "AS Montcerf",
    sport: "Football",
    technique: "Sublimation",
    image: "/images/real-montcerf.jpg",
  },
  {
    id: "titans",
    team: "Titans e-Sport",
    sport: "Jersey gaming",
    technique: "Flocage",
    image: "/images/real-titans.jpg",
  },
  {
    id: "vallon",
    team: "RC Vallon",
    sport: "Rugby",
    technique: "Broderie",
    image: "/images/real-vallon.jpg",
  },
  {
    id: "ampere",
    team: "Lycée Ampère",
    sport: "Athlétisme",
    technique: "Sublimation",
    image: "/images/real-ampere.jpg",
  },
  {
    id: "novastudio",
    team: "Novastudio",
    sport: "Corporate",
    technique: "Broderie",
    image: "/images/real-novastudio.jpg",
  },
  {
    id: "skema",
    team: "BDE Skema",
    sport: "Lifestyle",
    technique: "Flocage",
    image: "/images/real-skema.jpg",
  },
];

/** Visuel plein cadre du hero — direction photo cinématographique sombre. */
export const heroImage = "/images/hero.jpg";
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

export const contactEmail = "bonjour@lemnos.fr";

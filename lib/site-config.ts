/**
 * Bascules d'affichage du site public. Centralise les sections activables /
 * masquables sans supprimer de code — il suffit de repasser à `true`.
 */
export const siteConfig = {
  /**
   * Section « Réalisations » (portfolio) — nav, footer et page d'accueil.
   * Masquée au lancement tant qu'il n'y a pas de réalisations publiques : on
   * préfère une marque premium centrée sur la méthode et l'atelier plutôt
   * qu'une galerie vide. Repasser à `true` dès qu'il y a du contenu.
   */
  showRealisations: false,
};

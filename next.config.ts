import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * Le site manipule des documents administratifs et des données personnelles :
 * ces en-têtes coûtent une ligne chacun et ferment des classes entières
 * d'attaques. Ils sont volontairement stricts mais compatibles avec ce que
 * fait réellement l'application — aucune iframe, aucun script tiers.
 */
const EN_TETES_SECURITE = [
  // Empêche l'affichage du site dans une iframe : pas de détournement de clic.
  { key: "X-Frame-Options", value: "DENY" },
  // Le navigateur s'en tient au type déclaré, sans deviner.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // On ne fuite pas l'URL complète — qui peut contenir un identifiant de
  // dossier — vers les sites externes que l'utilisateur ouvre depuis ici.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Aucune de ces capacités n'est utilisée hors du scan, qui passe par un
  // choix de fichier explicite.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HTTPS obligatoire, y compris pour les visites suivantes.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Le numéro de version de Next n'apprend rien d'utile à un visiteur, et
  // beaucoup à quelqu'un qui cherche une faille connue.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:chemin*", headers: EN_TETES_SECURITE }];
  },

  /**
   * L'outil de lettre est devenu un module de l'espace membre. On garde
   * l'ancienne adresse vivante pour ne casser aucun lien déjà partagé.
   */
  async redirects() {
    return [
      { source: "/contester", destination: "/tableau-de-bord/lettre", permanent: true },
    ];
  },
};

export default nextConfig;

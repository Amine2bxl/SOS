import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

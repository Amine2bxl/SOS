import type { MetadataRoute } from "next";

/**
 * Le manifeste de l'application : sur un téléphone, « Ajouter à l'écran
 * d'accueil » installe l'espace membre comme une application, qui s'ouvre
 * directement sur les dossiers, sans barre de navigateur.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOS Citizens",
    short_name: "SOS Citizens",
    description: "Vérifier et contester une redevance de stationnement, avec une association citoyenne bruxelloise.",
    lang: "fr-BE",
    start_url: "/tableau-de-bord",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#0f1e3d",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nouveau courrier", short_name: "Scanner", url: "/tableau-de-bord/nouveau" },
      { name: "Mes dossiers", short_name: "Dossiers", url: "/tableau-de-bord/dossiers" },
    ],
  };
}

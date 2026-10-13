import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/useSession";
import { RetourLienEmail } from "@/components/RetourLienEmail";
import { LanguageProvider } from "@/lib/i18n";
import { ASSO } from "@/lib/data";
import { urlDuSite } from "@/lib/url-site";

/*
 * Deux familles, deux rôles.
 *
 * Bricolage Grotesque pour les titres : une grotesque à caractère, franche,
 * qui ne ressemble ni à un cabinet d'avocats ni à une administration. DM Sans
 * pour le texte : lisible à petite taille, sur un téléphone, au soleil.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Les liens d'aperçu (réseaux sociaux, messageries) ont besoin d'adresses
  // absolues : elles partent de l'URL publique du site.
  metadataBase: new URL(urlDuSite()),
  title: {
    default: "SOS Citizens — Contestez votre redevance de stationnement",
    template: "%s — SOS Citizens",
  },
  description:
    "Une photo de votre courrier suffit. Le moteur SOS lit la redevance, calcule votre délai, trouve vos arguments et rédige votre lettre de contestation. Association sans but lucratif, pour les 19 communes de Bruxelles-Capitale.",
  keywords: [
    "contester redevance stationnement",
    "redevance de stationnement Bruxelles",
    "parking.brussels contestation",
    "parkeerretributie betwisten",
    "lettre de contestation stationnement",
    "SOS Citizens",
  ],
  openGraph: {
    title: "SOS Citizens — Contestez votre redevance de stationnement",
    description:
      "Une photo, une analyse, une lettre prête à envoyer. Par une association citoyenne bruxelloise, pour les 19 communes de la Région.",
    locale: "fr_BE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1e3d",
  width: "device-width",
  initialScale: 1,
};

/** Données structurées : aident les moteurs de recherche à identifier l'association. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: ASSO.nom,
  description:
    "Association sans but lucratif qui aide les citoyens à comprendre et contester les redevances de stationnement dans les 19 communes de la Région de Bruxelles-Capitale.",
  foundingDate: "2024-08-16",
  telephone: ASSO.telephone,
  email: ASSO.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: ASSO.rue,
    postalCode: ASSO.codePostal,
    addressLocality: ASSO.ville,
    addressCountry: "BE",
  },
  areaServed: "BE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `data-scroll-behavior` : depuis Next 16, sans cet attribut, le défilement
    // doux s'appliquerait aussi aux changements de page — une navigation
    // paraîtrait lente.
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${dmSans.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SessionProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
          >
            Aller au contenu
          </a>
          {/* Aucun en-tête ni pied de page ici : chaque coquille — site public,
              écrans d'accès, espace membre — apporte le sien. C'est ce qui rend
              la frontière nette entre le site et l'application. */}
          <LanguageProvider>{children}</LanguageProvider>
          <RetourLienEmail />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}

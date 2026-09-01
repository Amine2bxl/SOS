import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/useSession";
import { LanguageProvider } from "@/lib/i18n";
import { ASSO } from "@/lib/data";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SOS Citizens ASBL — Contester une redevance de stationnement à Bruxelles",
    template: "%s — SOS Citizens ASBL",
  },
  description:
    "Association bruxelloise. Nous aidons les habitants à comprendre et contester les redevances de stationnement, les amendes et les sanctions communales. Deux contestations gratuites, et l'appel ne coûte rien.",
  keywords: [
    "SOS Citizens",
    "contester redevance stationnement",
    "parking.brussels",
    "amende Bruxelles",
    "sanction administrative communale",
    "ASBL Bruxelles",
  ],
  openGraph: {
    title: "SOS Citizens ASBL — Vous n'êtes pas seul face à votre amende",
    description:
      "Comprendre son courrier, réunir les bonnes preuves et contester dans les délais. Par une association bruxelloise.",
    locale: "fr_BE",
    type: "website",
  },
};

/** Données structurées : aide les moteurs de recherche à identifier l'association. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: ASSO.nom,
  description:
    "Association sans but lucratif bruxelloise qui accompagne les citoyens dans la contestation des redevances de stationnement et des sanctions administratives communales.",
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
  areaServed: "Région de Bruxelles-Capitale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SessionProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
          >
            Aller au contenu
          </a>
          {/* Aucun en-tête ni pied de page ici : chaque coquille — site public,
              écrans d'accès, espace membre — apporte le sien. C'est ce qui rend
              la frontière nette entre le site et l'application. */}
          <LanguageProvider>{children}</LanguageProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
    default: "SOS Citizens ASBL — Aide gratuite contre les redevances de stationnement à Bruxelles",
    template: "%s — SOS Citizens ASBL",
  },
  description:
    "Association bruxelloise qui aide gratuitement les citoyens à comprendre et contester les redevances de stationnement, les amendes et les sanctions administratives. Appelez-nous.",
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
      "Aide gratuite pour comprendre et contester les redevances de stationnement à Bruxelles.",
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
    "Association sans but lucratif bruxelloise qui accompagne gratuitement les citoyens dans la contestation des redevances de stationnement et des sanctions administratives.",
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
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}

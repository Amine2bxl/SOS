"use client";

import { Footer } from "@/components/Footer";
import { useSession } from "@/components/useSession";
import { useLangue } from "@/lib/i18n";

/**
 * Le pied de page n'existe que pour le site public. Une fois connecté, l'espace
 * membre devient l'application : le footer disparaît, on garde une interface
 * épurée, sans retour inutile vers le site public en bas de page.
 */
export function FooterSurSite() {
  const { connecte, chargement } = useSession();
  const { langue } = useLangue();
  if (chargement || connecte) return null;
  return <Footer langue={langue} />;
}
"use client";

import { Footer } from "@/components/Footer";
import { useLangue } from "@/lib/i18n";

/** Pied de page du site public. L'espace membre n'en a pas : c'est une application. */
export function PiedDePageSite() {
  const { langue } = useLangue();
  return <Footer langue={langue} />;
}

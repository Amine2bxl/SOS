import { HeaderSite } from "@/components/site/HeaderSite";
import { PiedDePageSite } from "@/components/site/PiedDePageSite";

/**
 * Coquille du site public : c'est la vitrine de l'association. Elle informe et
 * elle convainc, mais elle ne contient aucun outil — ceux-ci vivent dans
 * l'espace membre, qui a sa propre coquille. Cette séparation est volontaire :
 * on ne mélange plus le site et l'application.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderSite />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PiedDePageSite />
    </>
  );
}

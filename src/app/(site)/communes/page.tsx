import type { Metadata } from "next";
import { PageHead, LinkBtn, KeyBox } from "@/components/ui";
import { CadreReglementaire } from "@/components/guide";
import { BoutonContact } from "@/components/Contact";
import { ExplorateurCommunes } from "@/components/ExplorateurCommunes";
import { COMMUNES } from "@/lib/data";
import { lireReglesEnDirect } from "@/lib/communes-direct";

export const metadata: Metadata = {
  title: "Les 19 communes bruxelloises",
  description:
    "La carte des 19 communes de la Région de Bruxelles-Capitale : zones, horaires de paiement, gratuité, régime des riverains et derniers changements de règles, avec les sources officielles à consulter.",
};

/**
 * Rendue à chaque visite : les règles viennent de la base, et une correction
 * faite par l'association se voit dès la visite suivante — en direct pour qui
 * a déjà la page ouverte (voir `ExplorateurCommunes`).
 */
export default async function CommunesPage({
  searchParams,
}: {
  searchParams: Promise<{ commune?: string | string[] }>;
}) {
  const [{ commune }, direct] = await Promise.all([searchParams, lireReglesEnDirect()]);
  const slugInitial = typeof commune === "string" && COMMUNES.some((c) => c.slug === commune) ? commune : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <PageHead
        title="Les 19 communes bruxelloises"
        intro="Chaque commune a ses propres règles : zones, horaires, gratuité. Touchez la vôtre sur la carte."
      />

      <ExplorateurCommunes direct={direct} slugInitial={slugInitial} />

      <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-2">
        <CadreReglementaire />
        <KeyBox title="Bruxelles d'abord" ton="info">
          Les 19 communes de Bruxelles, aujourd&apos;hui. La Flandre puis la Wallonie, ensuite.
        </KeyBox>
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-ink-soft">
        C&apos;est de l&apos;information : le règlement de la commune fait foi. Un doute ?{" "}
        <BoutonContact variante="lien">Écrivez-nous</BoutonContact>.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkBtn href="/#analyser" variant="gold">
          Vérifier ma lettre
        </LinkBtn>
        <BoutonContact variante="secondaire">Demander de l&apos;aide</BoutonContact>
      </div>
    </div>
  );
}

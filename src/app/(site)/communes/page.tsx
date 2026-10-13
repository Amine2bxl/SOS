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
        kicker="Bruxelles-Capitale"
        title="Les 19 communes bruxelloises"
        intro="Chaque commune a ses zones, ses horaires et ses règles, fixés par son règlement communal en vigueur à la date des faits. Touchez la vôtre sur la carte : sa fiche s'ouvre, avec ce qui a changé récemment."
      />

      <ExplorateurCommunes direct={direct} slugInitial={slugInitial} />

      <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-2">
        <CadreReglementaire />
        <KeyBox title="Bruxelles d'abord" ton="info">
          SOS Citizens couvre aujourd&apos;hui les 19 communes de la Région de Bruxelles-Capitale. La
          Flandre, puis la Wallonie, suivront : chaque région ouvrira avec ses propres règles,
          vérifiées commune par commune.
        </KeyBox>
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-ink-soft">
        Ces pages sont un accompagnement d&apos;information : elles ne remplacent ni le règlement
        communal ni un avis juridique. En cas de doute sur le texte applicable,{" "}
        <BoutonContact variante="lien">écrivez-nous</BoutonContact> — nous vous aiderons à
        retrouver la bonne version.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkBtn href="/#analyser" variant="gold">
          Analyser mon courrier
        </LinkBtn>
        <BoutonContact variante="secondaire">Demander de l&apos;aide</BoutonContact>
      </div>
    </div>
  );
}

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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <PageHead
        title="Les 19 communes bruxelloises"
        intro="Zones, horaires, gratuité : chaque commune a ses règles. Touchez la vôtre."
      />

      <ExplorateurCommunes direct={direct} slugInitial={slugInitial} />

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <CadreReglementaire />
        <KeyBox title="Bruxelles d'abord" ton="info">
          Les 19 communes aujourd&apos;hui. Puis la Flandre et la Wallonie.
        </KeyBox>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:flex-row">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le règlement de la commune fait foi. Un doute ?{" "}
          <BoutonContact variante="lien">Écrivez-nous</BoutonContact>.
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <LinkBtn href="/#analyser" variant="gold">
            Vérifier ma lettre
          </LinkBtn>
          <BoutonContact variante="secondaire">Demander de l&apos;aide</BoutonContact>
        </div>
      </div>
    </div>
  );
}

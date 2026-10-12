import type { Metadata } from "next";
import { PageHead, LinkBtn, KeyBox } from "@/components/ui";
import { CadreReglementaire } from "@/components/guide";
import { BoutonContact } from "@/components/Contact";
import { ExplorateurCommunes } from "@/components/ExplorateurCommunes";

export const metadata: Metadata = {
  title: "Les 19 communes bruxelloises",
  description:
    "Zones, horaires de paiement, gratuité et régime des riverains dans les 19 communes de la Région de Bruxelles-Capitale, avec les sources officielles à consulter.",
};

export default function CommunesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <PageHead
        kicker="Repères"
        title="Les 19 communes bruxelloises"
        intro="Chaque commune a ses zones, ses horaires et ses règles — posés par son règlement communal, en vigueur à la date des faits. Choisissez la vôtre pour voir les repères."
      />

      <div className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-2">
        <CadreReglementaire />
        <KeyBox title="En Wallonie et en Flandre" ton="info">
          Chaque commune publie son propre règlement, et le délai figure sur votre courrier. Le moteur
          SOS le lit, reconnaît la région, et rédige votre lettre — en néerlandais pour la Flandre.
        </KeyBox>
      </div>

      <ExplorateurCommunes />

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-soft">
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
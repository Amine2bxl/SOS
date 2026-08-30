import type { Metadata } from "next";
import { PageHead, KeyBox, LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { ExplorateurCommunes } from "./ExplorateurCommunes";

export const metadata: Metadata = {
  title: "Les 19 communes bruxelloises",
  description:
    "Zones, horaires de paiement, gratuité et régime des riverains dans les 19 communes de la Région de Bruxelles-Capitale, avec les sources officielles à consulter.",
};

export default function CommunesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Repères"
        title="Les 19 communes bruxelloises"
        intro="Chaque commune a ses zones, ses horaires et ses règles — posés par son règlement communal, en vigueur à la date des faits. Choisissez la vôtre pour voir les repères."
      />

      <div className="mx-auto mt-8 max-w-3xl">
        <KeyBox title="Le cadre, valable partout en Région bruxelloise">
          Le stationnement est réglementé par chaque commune dans un règlement communal (le
          « règlement-redevance »), et géré en pratique par{" "}
          <strong className="text-navy-900">parking.brussels</strong>. Ne pas payer donne lieu à une{" "}
          <strong className="text-navy-900">redevance de stationnement</strong> : une dette
          administrative locale, distincte d&apos;une amende pénale de police.
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
        <LinkBtn href="/contester" variant="gold">
          Préparer ma lettre de contestation
        </LinkBtn>
        <BoutonContact variante="secondaire">Demander de l&apos;aide</BoutonContact>
      </div>
    </div>
  );
}
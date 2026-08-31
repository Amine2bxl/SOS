import type { Metadata } from "next";
import { listerDossiers } from "@/lib/dossiers";
import { COMMUNES } from "@/lib/data";
import { KeyBox, LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { ExplorateurCommunes } from "@/components/ExplorateurCommunes";

export const metadata: Metadata = { title: "Règles de ma commune" };
export const dynamic = "force-dynamic";

/**
 * Module « Règles de ma commune ».
 *
 * Même explorateur que la page publique, mais ouvert d'emblée sur la commune de
 * votre dossier le plus récent : dans l'espace membre, l'information est
 * rapportée à votre situation, pas présentée en catalogue.
 */
export default async function ReglesPage() {
  const dossiers = await listerDossiers();
  const communeDuDossier = dossiers.find((d) => d.commune && COMMUNES.some((c) => c.nom === d.commune))?.commune;
  const slugInitial = COMMUNES.find((c) => c.nom === communeDuDossier)?.slug;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900">
          Les règles qui s&apos;appliquent à mon dossier
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {communeDuDossier
            ? `Votre dossier le plus récent concerne ${communeDuDossier} : sa fiche est ouverte ci-dessous.`
            : "Chaque commune a ses zones, ses horaires et ses règles, posés par son règlement communal en vigueur à la date des faits."}
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-3xl">
        <KeyBox title="Le cadre, valable partout en Région bruxelloise">
          Le stationnement est réglementé par chaque commune dans son règlement-redevance, et géré
          en pratique par <strong className="text-navy-900">parking.brussels</strong>. Ne pas payer
          donne lieu à une <strong className="text-navy-900">redevance de stationnement</strong> :
          une dette administrative locale, distincte d&apos;une amende pénale de police.
        </KeyBox>
      </div>

      <ExplorateurCommunes slugInitial={slugInitial} />

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-soft">
        Ces repères ne remplacent ni le règlement communal ni un avis juridique. En cas de doute sur
        le texte applicable, <BoutonContact variante="lien">écrivez-nous</BoutonContact> — nous vous
        aiderons à retrouver la bonne version.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkBtn href="/tableau-de-bord/lettre" variant="gold">
          Rédiger ma lettre de contestation
        </LinkBtn>
        <LinkBtn href="/comprendre" variant="secondary">
          Comprendre mon courrier
        </LinkBtn>
      </div>
    </div>
  );
}

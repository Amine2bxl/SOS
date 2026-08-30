import type { Metadata } from "next";
import { PageHead, Card } from "@/components/ui";
import { ASSO } from "@/lib/data";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Identification de SOS Citizens ASBL, responsable de publication, hébergeur et conditions de responsabilité du site.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHead kicker="Informations légales" title="Mentions légales" />

      <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-ink-soft">
        Conformément à la législation belge applicable aux services de la société de
        l&apos;information, l&apos;éditeur du site est identifié ci-dessous.
      </p>

      <Card title="Éditeur du site" className="mt-8">
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-navy-900">Dénomination</dt>
            <dd className="text-ink-soft">{ASSO.nom}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Forme juridique</dt>
            <dd className="text-ink-soft">{ASSO.formeJuridique}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Numéro d&apos;entreprise (BCE)</dt>
            <dd className="text-ink-soft">{ASSO.bce}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Date de constitution</dt>
            <dd className="text-ink-soft">{ASSO.constitution}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Siège social</dt>
            <dd className="text-ink-soft">
              {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}, {ASSO.pays}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Président</dt>
            <dd className="text-ink-soft">{ASSO.president}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Administrateurs</dt>
            <dd className="text-ink-soft">{ASSO.administrateurs.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Téléphone</dt>
            <dd className="text-ink-soft">
              <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold text-navy-700 underline">
                {ASSO.telephone}
              </a>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-navy-900">Adresse e-mail</dt>
            <dd className="text-ink-soft">
              <a href={`mailto:${ASSO.email}`} className="break-all font-semibold text-navy-700 underline">
                {ASSO.email}
              </a>
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Responsable de publication" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le responsable de la publication du site est le président de l&apos;association, {ASSO.president}.
        </p>
      </Card>

      <Card title="Hébergeur" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le site est hébergé par Vercel Inc., société américaine, dont le siège est situé au 440
          North Barranca Avenue #4133, Covina, CA 91723, États-Unis. Les données de compte sont
          conservées chez notre prestataire de base de données, dans le cadre de la politique de
          protection des données décrite sur la page dédiée.
        </p>
      </Card>

      <Card title="Nature du site et limites de responsabilité" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          SOS Citizens ASBL est une association d&apos;information et d&apos;accompagnement citoyen,
          et non un cabinet d&apos;avocats. Le site met à disposition des explications, des repères et
          des modèles de courrier destinés à permettre aux citoyens de se défendre eux-mêmes.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          L&apos;association ne promet et ne garantit aucune annulation : chaque dossier dépend des
          faits, des preuves et du règlement applicable. Les informations diffusées peuvent changer
          (tarifs, zones, procédures) ; elles n&apos;ont qu&apos;une valeur informative et ne se
          substituent jamais au texte officiel en vigueur ni à un avis juridique individualisé.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          L&apos;association s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées,
          mais ne peut être tenue responsable des conséquences d&apos;une utilisation des contenus,
          des liens externes ou d&apos;une erreur éventuelle.
        </p>
      </Card>

      <Card title="Propriété intellectuelle" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Les textes, illustrations, logos et éléments graphiques du site sont la propriété de SOS
          Citizens ASBL, sauf mention contraire. Toute reproduction, diffusion ou exploitation sans
          autorisation préalable est interdite, hors exceptions légales.
        </p>
      </Card>

      <Card title="Droit applicable" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le site et son utilisation sont soumis au droit belge. À défaut d&apos;accord amiable, les
          tribunaux de Bruxelles sont seuls compétents.
        </p>
      </Card>
    </div>
  );
}
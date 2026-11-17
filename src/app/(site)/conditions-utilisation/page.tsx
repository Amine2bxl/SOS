import type { Metadata } from "next";
import { PageHead, Card } from "@/components/ui";
import { ASSO } from "@/lib/data";
import { DOCUMENTS_LEGAUX } from "@/lib/versions-legales";

const DOC = DOCUMENTS_LEGAUX.cgu;
const dateLongue = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Les conditions d'utilisation du site SOS Citizens : services, compte, responsabilités et droit applicable.",
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Règles du service"
        title="Conditions d'utilisation"
        intro="En utilisant ce site, vous acceptez les conditions décrites ci-dessous. Elles sont écrites pour rester simples et prévisibles."
      />
      <p className="mt-4 text-center text-xs text-ink-faint">
        Version {DOC.version} · en vigueur depuis le {dateLongue(DOC.date)}
      </p>

      <Card title="Un service d'information et d'accompagnement" className="mt-8">
        <p className="text-sm leading-relaxed text-ink-soft">
          {ASSO.nom} met à disposition des contenus d&apos;information, un moteur d&apos;analyse des
          courriers de redevance, un outil de rédaction de lettres, un scanner de documents et un
          espace de suivi des dossiers. Les conclusions du moteur sont une aide à la décision, fondée
          sur les informations que vous confirmez : elles ne remplacent pas votre propre lecture du
          courrier, dont les mentions font foi. Ce
          service est un accompagnement citoyen : il ne constitue pas un contrat de conseil
          juridique ni d&apos;avocat, et ne garantit aucune issue sur un dossier.
        </p>
      </Card>

      <Card title="Ce que signifient les résultats" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Chaque élément contrôlé reçoit l&apos;un de trois verdicts.{" "}
          <strong className="text-navy-900">Établi</strong> : le point satisfait le critère vérifié — ce
          n&apos;est pas une certification de toute la redevance.{" "}
          <strong className="text-navy-900">Anomalie potentielle</strong> : une discordance ou un élément à
          examiner — ce n&apos;est pas une illégalité constatée.{" "}
          <strong className="text-navy-900">Non déterminable</strong> : les données ne permettent pas de
          conclure — cela ne dit rien de la validité de la redevance. Un frais n&apos;est jamais présenté comme
          irrégulier sur son seul montant.
        </p>
      </Card>

      <Card title="Délais, envoi et preuves" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          La date limite affichée est un calcul, avec sa trace : elle ne remplace pas les mentions de votre
          courrier, et c&apos;est à vous de surveiller vos échéances. Ouvrir un dossier, préparer une lettre ou
          demander de l&apos;aide n&apos;interrompt aucun délai et ne suspend pas le recouvrement. Aucun courrier
          ne part en votre nom sans votre action. Une preuve d&apos;envoi ne prouve pas la réception : gardez
          vos récépissés, captures et accusés.
        </p>
      </Card>

      <Card title="Confier un dossier à l'association : le mandat" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Vous pouvez confier un dossier à l&apos;association en lui donnant mandat depuis la fiche du
          dossier. Le mandat couvre ce seul dossier, pour la durée que vous choisissez (un an au plus), et
          précise ce qu&apos;il autorise : consulter le dossier et, si vous le cochez, écrire en votre nom à
          l&apos;organisme qui réclame. Vous le retirez à tout moment ; l&apos;accès s&apos;arrête aussitôt,
          sans effacer ce qui a été fait avant. La réception d&apos;une demande ne vaut pas acceptation
          automatique d&apos;une mission, et un mandat n&apos;oblige aucune administration à accepter cette
          représentation. L&apos;association n&apos;assure aucune représentation en justice réservée aux
          avocats.
        </p>
      </Card>

      <Card title="Création d'un compte" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          La création d&apos;un compte est gratuite et supposée réservée aux personnes majeures ou
          aux personnes habilitées à agir pour un véhicule. Vous vous engagez à fournir des
          informations exactes et à garder l&apos;accès à votre boîte e-mail pour vous : c&apos;est elle qui
          ouvre votre compte, par un code à usage unique. Un compte par personne. Vous êtes
          responsable de ce qui est fait depuis votre compte.
        </p>
      </Card>

      <Card title="Les contestations gratuites et l'adhésion" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Chaque formule définit un nombre de contestations gratuites et les services associés,
          décrits sur la page des tarifs. Au-delà, une adhésion annuelle est requise pour ouvrir de
          nouveaux dossiers. Les dossiers déjà ouverts restent accessibles. L&apos;adhésion est
          validée par l&apos;association après réception du paiement ; elle n&apos;est pas reconduite
          automatiquement.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Trois choses distinctes : créer un compte ne fait pas de vous un membre de l&apos;association ;
          l&apos;adhésion ouvre les services décrits sur la page des tarifs ; un don soutient
          l&apos;association sans contrepartie et ne donne droit ni à la qualité de membre, ni à un service,
          ni — à ce jour — à une attestation fiscale.
        </p>
      </Card>

      <Card title="Vos responsabilités" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Vous êtes responsable de l&apos;exactitude des informations que vous saisissez et de la
          conformité de votre utilisation avec le droit applicable. Il vous est interdit de détourner
          le service, de tenter d&apos;accéder aux données d&apos;un autre utilisateur ou de nuire au
          fonctionnement du site.
        </p>
      </Card>

      <Card title="Notre responsabilité" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le site est fourni sur une base « tel quel ». L&apos;association ne peut garantir
          l&apos;annulation d&apos;une redevance ni le résultat d&apos;une démarche et décline toute
          responsabilité pour les décisions prises sur la seule base des informations publiées, qui
          doivent toujours être recoupées avec le texte officiel applicable. Notre responsabilité ne
          saurait être engagée pour les éventuelles interruptions du service, pertes de données ou
          contenus de sites externes.
        </p>
      </Card>

      <Card title="Suspension et suppression du compte" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Vous pouvez fermer votre compte et supprimer vos dossiers à tout moment depuis votre espace
          ou sur demande à l&apos;association. Celle-ci peut suspendre l&apos;accès d&apos;un compte
          en cas d&apos;utilisation abusive ou contraire aux conditions, après avertissement lorsque
          cela est raisonnablement possible.
        </p>
      </Card>

      <Card title="Droit applicable et litiges" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Les présentes conditions sont soumises au droit belge. En cas de litige, une solution
          amiable sera recherchée en priorité ; à défaut, les tribunaux de Bruxelles sont compétents.
          Les droits impératifs reconnus aux consommateurs restent entièrement réservés.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Une réclamation sur le service s&apos;adresse à l&apos;association par le formulaire de contact. Elle
          ne remplace pas une contestation à introduire auprès de l&apos;administration.
        </p>
      </Card>

      <Card title="Modifications" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Ces conditions portent un numéro de version. Quand elles changent, la version change aussi, et
          les membres sont invités à accepter la nouvelle à leur prochaine visite ; la date et la version de
          chaque acceptation sont conservées.
        </p>
      </Card>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Version {DOC.version}. La version en ligne fait foi.
      </p>
    </div>
  );
}
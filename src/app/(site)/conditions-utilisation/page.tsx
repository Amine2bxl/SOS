import type { Metadata } from "next";
import { PageHead, Card } from "@/components/ui";
import { ASSO } from "@/lib/data";

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

      <Card title="Un service d'information et d'accompagnement" className="mt-8">
        <p className="text-sm leading-relaxed text-ink-soft">
          {ASSO.nom} met à disposition des contenus d&apos;information, un outil de rédaction de
          lettre de contestation, un scanner de documents et un espace de suivi des dossiers. Ce
          service est un accompagnement citoyen : il ne constitue pas un contrat de conseil
          juridique ni d&apos;avocat, et ne garantit aucune issue sur un dossier.
        </p>
      </Card>

      <Card title="Création d'un compte" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          La création d&apos;un compte est gratuite et supposée réservée aux personnes majeures ou
          aux personnes habilitées à agir pour un véhicule. Vous vous engagez à fournir des
          informations exactes, notamment votre adresse e-mail, et à garder votre mot de passe
          confidentiel. Vous êtes responsable de ce qui est fait depuis votre compte.
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
        </p>
      </Card>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Dernière mise à jour : août 2026. La version en ligne fait foi.
      </p>
    </div>
  );
}
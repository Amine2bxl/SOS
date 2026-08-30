import type { Metadata } from "next";
import { PageHead, Card, Check } from "@/components/ui";
import { ASSO } from "@/lib/data";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Quelles données SOS Citizens collecte, pourquoi, combien de temps elle les conserve, et quels sont vos droits (RGPD).",
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Vos droits"
        title="Politique de confidentialité"
        intro="Cette page explique, dans un langage clair, quelles données nous traitons, pourquoi, et les droits que vous avez sur elles (RGPD)."
      />

      <Card title="Qui est responsable de vos données ?" className="mt-8">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le responsable du traitement est <strong className="text-navy-900">{ASSO.nom}</strong>,{" "}
          {ASSO.formeJuridique}, siège social : {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}. Pour
          toute question :{" "}
          <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
            {ASSO.email}
          </a>{" "}
          ou au {ASSO.telephone}.
        </p>
      </Card>

      <Card title="Quelles données collectons-nous ?" className="mt-6">
        <ul className="space-y-2.5 text-sm text-ink">
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            <span>
              <strong className="text-navy-900">Création de compte :</strong> adresse e-mail, prénom,
              nom, et, si vous les renseignez, adresse, code postal et commune.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            <span>
              <strong className="text-navy-900">Dossiers de contestation :</strong> les informations du
              courrier que vous confirmez (référence, montant, dates, plaque, commune, autorité) et le
              texte extrait de votre document.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            <span>
              <strong className="text-navy-900">Messages :</strong> les e-mails et messages que vous nous
              envoyez.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            <span>
              <strong className="text-navy-900">Aucune donnée de paiement :</strong> le paiement en ligne
              n&apos;est pas actif, aucune donnée bancaire ne nous est transmise.
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          L&apos;outil de lettre en libre accès (page « Contester ») fonctionne entièrement dans votre
          navigateur : rien n&apos;y est enregistré, rien n&apos;y est envoyé. La lecture des documents
          par le scanner se fait également dans votre navigateur ; seul le texte des informations
          confirmées est conservé dans votre dossier.
        </p>
      </Card>

      <Card title="Pourquoi et sur quelle base ?" className="mt-6">
        <ul className="space-y-2.5 text-sm text-ink">
          <li>
            <strong className="text-navy-900">Vous accompagner</strong> dans le suivi de vos dossiers :
            exécution de la demande que vous avez iniciée (article 6.1.b RGPD).
          </li>
          <li>
            <strong className="text-navy-900">Répondre à vos messages</strong> et vous conseiller :
            intérêt légitime de l&apos;association (article 6.1.f RGPD).
          </li>
          <li>
            <strong className="text-navy-900">Gérer votre adhésion</strong> (formule, demande, éventuelle
            facturation) : exécution du contrat ou obligations légales.
          </li>
        </ul>
      </Card>

      <Card title="Combien de temps conservons-nous vos données ?" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Votre compte et vos dossiers sont conservés aussi longtemps que vous les gardez. Vous pouvez
          les supprimer à tout moment depuis votre espace, ou nous demander leur effacement. Les e-mails
          reçus sont conservés le temps de vous accompagner, puis supprimés sur demande. Les données
          nécessaires à la preuve d&apos;une transaction (adhésion) peuvent être conservées le temps
          requis par les obligations légales.
        </p>
      </Card>

      <Card title="À qui vos données sont-elles confiées ?" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Les données de compte et de dossiers sont stockées dans la base de données de notre
          prestataire technique (Supabase), qui agit en sous-traitant et auquel l&apos;accès est
          limité par des règles de sécurité (« politiques de sécurité au niveau des lignes ») : chaque
          utilisateur ne voit que ses propres données. Le site est hébergé par Vercel. Nous ne vendons,
          ne louons et ne transmettons aucune donnée à des tiers à des fins commerciales ou publicitaires.
        </p>
      </Card>

      <Card title="Cookies et mesures techniques" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le site n&apos;utilise aucune solution de mesure d&apos;audience ni de publicité. Un cookie
          de session d&apos;authentification est posé lorsque vous êtes connecté, uniquement pour vous
          garder connecté de manière sécurisée. La connexion est chiffrée (HTTPS).
        </p>
      </Card>

      <Card title="Vos droits" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation,
          de portabilité et d&apos;opposition sur vos données. Vous pouvez les exercer en nous écrivant
          à{" "}
          <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
            {ASSO.email}
          </a>
          . Nous répondons dans les meilleurs délais et au plus tard dans le mois.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Vous pouvez également introduire une réclamation auprès de l&apos;Autorité de protection des
          données (www.autoriteprotectiondonnees.be).
        </p>
      </Card>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Dernière mise à jour : août 2026. Cette politique peut être adaptée ; la version en ligne fait
        toujours foi.
      </p>
    </div>
  );
}
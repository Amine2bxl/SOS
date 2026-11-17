import type { Metadata } from "next";
import { PageHead, Card } from "@/components/ui";
import { ASSO } from "@/lib/data";
import { DOCUMENTS_LEGAUX } from "@/lib/versions-legales";

const DOC = DOCUMENTS_LEGAUX.confidentialite;
const dateLongue = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

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
      <p className="mt-4 text-center text-xs text-ink-faint">
        Version {DOC.version} · en vigueur depuis le {dateLongue(DOC.date)}
      </p>

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
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            <span>
              <strong className="text-navy-900">Création de compte :</strong> votre adresse e-mail, puis,
              si vous les renseignez pour vos lettres, vos prénom, nom, adresse, code postal, commune et
              téléphone.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            <span>
              <strong className="text-navy-900">Dossiers de contestation :</strong> les informations du
              courrier que vous confirmez (référence, montant, dates, plaque, commune, organisme), vos
              réponses aux questions du moteur, l&apos;analyse qui en résulte, vos lettres, et le texte
              extrait de votre document.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            <span>
              <strong className="text-navy-900">Messages :</strong> les e-mails et messages que vous nous
              envoyez ; par le formulaire de contact, votre nom, votre e-mail, le sujet et le message.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            <span>
              <strong className="text-navy-900">Préférences et acceptations :</strong> le type de compte
              (particulier ou organisation), le nom de l&apos;organisation, la langue de l&apos;interface, et la
              version des documents juridiques que vous avez acceptée, avec sa date.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            <span>
              <strong className="text-navy-900">Mandats :</strong> si vous confiez un dossier à
              l&apos;association, ce que le mandat autorise, sa durée, sa date, son éventuel retrait et votre
              message.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            <span>
              <strong className="text-navy-900">Aucune donnée de paiement :</strong> le paiement en ligne
              n&apos;est pas actif, aucune donnée bancaire ne nous est transmise.
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          La lecture des documents se fait dans votre navigateur : votre photo ou votre PDF ne
          quittent jamais votre appareil, et nous ne les stockons nulle part. Pour l&apos;analyse, les
          informations confirmées (dates, montant, commune, réponses) sont transmises à notre
          moteur ; sans compte, elles ne sont pas enregistrées. Si vous demandez votre lettre avant
          d&apos;avoir un compte, elles restent quelques heures dans votre navigateur, le temps de le
          créer. Dans un dossier, le texte lu sur le courrier est effacé au bout de six mois.
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
          <li>
            <strong className="text-navy-900">Accompagner un dossier que vous nous confiez</strong>, dans
            les limites du mandat : exécution de votre demande (article 6.1.b RGPD).
          </li>
          <li>
            <strong className="text-navy-900">Garder la preuve de vos acceptations</strong> : obligation de
            pouvoir démontrer votre accord (article 7.1 RGPD).
          </li>
        </ul>
      </Card>

      <Card title="L'analyse automatisée de vos courriers" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le moteur SOS applique des règles écrites et vérifiables : il ne devine rien, ne génère pas de texte
          librement et ne fait appel à aucun service d&apos;intelligence artificielle extérieur. Chaque élément
          contrôlé reçoit l&apos;un de trois verdicts — <strong className="text-navy-900">établi</strong>,{" "}
          <strong className="text-navy-900">anomalie potentielle</strong> ou{" "}
          <strong className="text-navy-900">non déterminable</strong> — et chaque conclusion s&apos;explique.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Le moteur ne prend aucune décision à votre place (article 22 RGPD) : il propose, vous décidez. Rien
          n&apos;est envoyé à une administration sans votre action, et une information lue automatiquement
          doit être confirmée par vous avant de compter.
        </p>
      </Card>

      <Card title="Combien de temps conservons-nous vos données ?" className="mt-6">
        <ul className="space-y-2.5 text-sm leading-relaxed text-ink">
          <li>
            <strong className="text-navy-900">Votre compte et vos dossiers</strong> : aussi longtemps
            que vous les gardez. Vous les supprimez vous-même, depuis « Mon compte », sans avoir à
            nous le demander et sans délai.
          </li>
          <li>
            <strong className="text-navy-900">Le texte lu sur vos courriers scannés</strong> : effacé
            automatiquement six mois après le scan. Il ne sert qu&apos;à vous permettre de
            revérifier une information qui vous paraîtrait mal lue ; passé le délai de recours et de
            traitement, il n&apos;a plus d&apos;usage. Les informations que vous avez confirmées,
            elles, restent dans votre dossier.
          </li>
          <li>
            <strong className="text-navy-900">Les e-mails que vous nous envoyez</strong> : le temps de
            vous accompagner, puis supprimés sur demande.
          </li>
          <li>
            <strong className="text-navy-900">Les messages du formulaire de contact</strong> : effacés
            automatiquement douze mois après leur réception.
          </li>
          <li>
            <strong className="text-navy-900">Les mandats et vos acceptations</strong> : avec le dossier ou
            le compte auquel ils se rattachent, et effacés avec lui.
          </li>
          <li>
            <strong className="text-navy-900">La trace d&apos;une adhésion payée</strong> : conservée
            le temps requis par les obligations comptables. Elle ne contient ni votre nom, ni votre
            adresse, ni votre plaque — seulement la formule, le montant et la référence du paiement.
          </li>
        </ul>
      </Card>

      <Card title="À qui vos données sont-elles confiées ?" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le site est hébergé par Vercel ; les e-mails de connexion sont envoyés par Resend ; si elle
          est active, la vérification anti-robot est assurée par Cloudflare Turnstile ; si vous la
          choisissez, la connexion avec Google passe par Google. Les données de compte et de dossiers
          sont stockées dans la base de données de notre prestataire technique (Supabase), qui agit
          en sous-traitant et auquel l&apos;accès est
          limité par des règles de sécurité (« politiques de sécurité au niveau des lignes ») : chaque
          utilisateur ne voit que ses propres données. Les bénévoles de l&apos;association ne voient un
          dossier que lorsque vous leur donnez mandat, et seulement celui-là, le temps du mandat. Nous ne vendons,
          ne louons et ne transmettons aucune donnée à des tiers à des fins commerciales ou publicitaires.
        </p>
      </Card>

      <div id="cookies" className="scroll-mt-24" />
      <Card title="Cookies et mesures techniques" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le site n&apos;utilise aucune solution de mesure d&apos;audience ni de publicité. Un cookie
          de session d&apos;authentification est posé lorsque vous êtes connecté, uniquement pour vous
          garder connecté de manière sécurisée. La connexion est chiffrée (HTTPS).
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Votre navigateur garde aussi quelques préférences, qui ne nous sont jamais envoyées : la langue
          choisie (<code className="font-mono text-xs">sos.langue</code>), le brouillon d&apos;une analyse
          le temps de créer votre compte, six heures au plus (<code className="font-mono text-xs">sos:brouillon</code>),
          et le fait que vous avez lu l&apos;avis sur les cookies (<code className="font-mono text-xs">sos.avis-cookies</code>).
          Tout cela est strictement nécessaire au service : aucun consentement n&apos;est requis, mais vous
          pouvez l&apos;effacer à tout moment depuis votre navigateur.
        </p>
      </Card>

      <div id="droits" className="scroll-mt-24" />
      <Card title="Vos droits" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation,
          de portabilité et d&apos;opposition sur vos données. Depuis « Mon compte », vous téléchargez
          toutes vos données en un fichier, vous les corrigez et vous supprimez votre compte vous-même.
          Pour le reste, écrivez-nous à{" "}
          <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
            {ASSO.email}
          </a>
          . Nous répondons dans les meilleurs délais et au plus tard dans le mois.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Vous pouvez également introduire une réclamation auprès de l&apos;Autorité de protection des
          données : rue de la Presse 35, 1000 Bruxelles —{" "}
          <a href="https://www.autoriteprotectiondonnees.be" className="font-semibold text-navy-700 underline" rel="noopener noreferrer" target="_blank">
            autoriteprotectiondonnees.be
          </a>
          .
        </p>
      </Card>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Version {DOC.version}. Quand cette politique change, sa version change aussi : les membres sont
        invités à relire la nouvelle à leur prochaine visite, et l&apos;ancienne acceptation reste enregistrée.
      </p>
    </div>
  );
}
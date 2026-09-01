import type { Metadata } from "next";
import Link from "next/link";
import { listerDossiers, lireProfil } from "@/lib/dossiers";
import {
  joursAvantEcheance,
  formatMontant,
  formatDate,
  TYPES_DOCUMENT,
  type Dossier,
} from "@/lib/dossiers-format";
import { completudeProfil, echeanceContestation } from "@/lib/contestation";
import { LinkBtn, Card } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { PayerOuContester } from "@/components/guide";

export const metadata: Metadata = { title: "Contester ma redevance" };
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */

type Etat = "sans-dossier" | "sans-lettre" | "a-envoyer" | "envoyee" | "termine";

/** Où en est-on, pour ce dossier précis. Une seule réponse possible. */
function etatDu(dossier: Dossier | null): Etat {
  if (!dossier) return "sans-dossier";
  if (["accepte", "rejete", "clos"].includes(dossier.statut)) return "termine";
  if (["contestation_envoyee", "en_attente_reponse"].includes(dossier.statut)) return "envoyee";
  return dossier.lettre ? "a-envoyer" : "sans-lettre";
}

const ETAPES = [
  {
    titre: "Votre courrier",
    resume: "Photographiez-le. Nous en extrayons tout : référence, montant, dates, lieu, plaque.",
  },
  {
    titre: "Votre lettre",
    resume: "Elle s'écrit avec les bons arguments et les bonnes annexes. Vous relisez.",
  },
  {
    titre: "L'envoi et la preuve",
    resume: "Vous l'envoyez par le canal imposé, gardez une preuve, et le suivi démarre.",
  },
];

/** Numéro de l'étape en cours (0, 1 ou 2), à partir de l'état du dossier. */
function etapeCourante(etat: Etat): number {
  if (etat === "sans-dossier") return 0;
  if (etat === "sans-lettre") return 1;
  return 2;
}

/* -------------------------------------------------------------------------- */

function Etape({
  numero,
  titre,
  resume,
  statut,
  children,
}: {
  numero: number;
  titre: string;
  resume: string;
  statut: "faite" | "en-cours" | "a-venir";
  children?: React.ReactNode;
}) {
  return (
    <li
      className={`relative rounded-2xl border-2 p-6 transition ${
        statut === "en-cours"
          ? "border-gold-400 bg-card shadow-lg"
          : statut === "faite"
            ? "border-ok-600/30 bg-ok-100/30"
            : "border-line bg-card/50"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-black ${
            statut === "faite"
              ? "bg-ok-600 text-white"
              : statut === "en-cours"
                ? "bg-gold-400 text-navy-950"
                : "bg-navy-100 text-navy-700"
          }`}
        >
          {statut === "faite" ? "✓" : numero}
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className={`font-display text-xl font-bold ${
              statut === "a-venir" ? "text-ink-soft" : "text-navy-900"
            }`}
          >
            {titre}
          </h3>
          <p
            className={`mt-1 text-sm leading-relaxed ${
              statut === "a-venir" ? "text-ink-soft/70" : "text-ink-soft"
            }`}
          >
            {resume}
          </p>
          {statut === "en-cours" && children && <div className="mt-5">{children}</div>}
        </div>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */

export default async function ContesterPage() {
  const [dossiers, profil] = await Promise.all([listerDossiers(), lireProfil()]);

  // Le dossier sur lequel on travaille : le plus urgent des dossiers ouverts.
  const ouverts = dossiers.filter((d) => !["accepte", "rejete", "clos"].includes(d.statut));
  const dossier =
    ouverts
      .slice()
      .sort((a, b) => {
        const ja = joursAvantEcheance(a.date_echeance) ?? 9999;
        const jb = joursAvantEcheance(b.date_echeance) ?? 9999;
        return ja - jb;
      })[0] ?? null;

  const etat = etatDu(dossier);
  const courante = etapeCourante(etat);
  const jours = dossier ? joursAvantEcheance(dossier.date_echeance) : null;
  const delai = dossier ? echeanceContestation(dossier.date_envoi ?? "") : null;
  const profilComplet = completudeProfil(profil);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
          Contester ma redevance
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
          Trois étapes, dans l&apos;ordre. À chaque instant, une seule chose à faire — celle qui est
          en jaune ci-dessous.
        </p>
      </div>

      {/* Le dossier concerné et son délai : le contexte, en une ligne. */}
      {dossier && (
        <div className="mt-7 rounded-xl border border-line bg-card p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Dossier en cours
            </p>
            <Link
              href={`/tableau-de-bord/${dossier.id}`}
              className="font-display text-lg font-bold text-navy-900 hover:underline"
            >
              {dossier.reference ?? "Dossier sans référence"}
            </Link>
            <p className="text-sm text-ink-soft">
              {TYPES_DOCUMENT[dossier.type_document] ?? dossier.type_document}
              {dossier.commune && ` — ${dossier.commune}`} · {formatMontant(dossier.montant)}
            </p>
          </div>
          {jours !== null && (
            <p
              className={`mt-3 shrink-0 rounded-lg px-3 py-2 text-sm font-bold sm:mt-0 ${
                jours < 0
                  ? "bg-danger-100 text-danger-700"
                  : jours <= 7
                    ? "bg-warn-100 text-warn-700"
                    : "bg-ok-100 text-ok-700"
              }`}
            >
              {jours < 0
                ? `Délai dépassé de ${-jours} j`
                : jours === 0
                  ? "Échéance aujourd'hui"
                  : `${jours} jour${jours > 1 ? "s" : ""} restant${jours > 1 ? "s" : ""}`}
            </p>
          )}
        </div>
      )}

      {ouverts.length > 1 && (
        <p className="mt-2 text-center text-xs text-ink-soft">
          Vous avez {ouverts.length} dossiers ouverts. Celui-ci est le plus pressé —{" "}
          <Link href="/tableau-de-bord" className="font-semibold text-navy-700 underline">
            voir tous mes dossiers
          </Link>
          .
        </p>
      )}

      {/* LES TROIS ÉTAPES */}
      <ol className="mt-8 space-y-4">
        <Etape
          numero={1}
          titre={ETAPES[0].titre}
          resume={ETAPES[0].resume}
          statut={courante === 0 ? "en-cours" : "faite"}
        >
          <LinkBtn href="/tableau-de-bord/nouveau" variant="gold" className="px-6 py-3.5 text-base">
            Photographier mon courrier →
          </LinkBtn>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Photo, capture d&apos;écran ou PDF. La lecture se fait sur votre appareil : le fichier
            ne part sur aucun serveur.
          </p>
        </Etape>

        <Etape
          numero={2}
          titre={ETAPES[1].titre}
          resume={ETAPES[1].resume}
          statut={courante === 1 ? "en-cours" : courante > 1 ? "faite" : "a-venir"}
        >
          <LinkBtn
            href={dossier ? `/tableau-de-bord/lettre?dossier=${dossier.id}` : "/tableau-de-bord/lettre"}
            variant="gold"
            className="px-6 py-3.5 text-base"
          >
            Rédiger ma lettre →
          </LinkBtn>
          {!profilComplet.complet && (
            <p className="mt-3 rounded-md bg-navy-50 p-3 text-xs leading-relaxed text-ink">
              Il manque {profilComplet.manquants.map((m) => m.libelle.toLowerCase()).join(", ")} dans
              votre profil. Ces coordonnées sont exigées sur toute contestation.{" "}
              <Link href="/tableau-de-bord/compte" className="font-semibold text-navy-700 underline">
                Les renseigner maintenant
              </Link>{" "}
              vous évite de les retaper à chaque lettre.
            </p>
          )}
        </Etape>

        <Etape
          numero={3}
          titre={ETAPES[2].titre}
          resume={ETAPES[2].resume}
          statut={etat === "envoyee" || etat === "termine" ? "faite" : courante === 2 ? "en-cours" : "a-venir"}
        >
          <ol className="space-y-3 text-sm text-ink">
            {[
              <>
                Ouvrez le canal imposé par votre courrier. Pour parking.brussels, c&apos;est le
                <strong> formulaire en ligne</strong>.
              </>,
              <>
                Collez votre lettre et joignez vos pièces — 10 Mo au total, un fichier .zip est
                accepté au-delà.
              </>,
              <>
                <strong>Gardez une preuve</strong> : capture d&apos;écran de l&apos;envoi, numéro de
                suivi ou accusé de réception.
              </>,
              <>
                Revenez ici dire que c&apos;est parti :{" "}
                {dossier ? (
                  <Link
                    href={`/tableau-de-bord/${dossier.id}`}
                    className="font-semibold text-navy-700 underline"
                  >
                    mettre le dossier à jour
                  </Link>
                ) : (
                  "le suivi des relances démarre alors tout seul"
                )}
                .
              </>,
            ].map((texte, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">
                  {i + 1}
                </span>
                <span>{texte}</span>
              </li>
            ))}
          </ol>
        </Etape>
      </ol>

      {/* Contestation déjà partie : on rassure et on donne la suite. */}
      {etat === "envoyee" && (
        <Card className="mt-6 border-ok-600/40 bg-ok-100/40">
          <p className="font-display text-lg font-bold text-ok-700">
            Votre contestation est partie ✓
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Il n&apos;y a plus rien à faire dans l&apos;immédiat. Sans réponse d&apos;ici un mois,
            relancez l&apos;autorité en citant votre référence et la date d&apos;envoi. Nous vous
            prévenons si une échéance approche.
          </p>
        </Card>
      )}

      {/* Le délai calculé, quand on le connaît. */}
      {delai && etat !== "envoyee" && etat !== "termine" && (
        <Card className={`mt-6 ${delai.depasse ? "border-danger-600/40" : "border-navy-600/30"}`}>
          <p className="font-display text-base font-bold text-navy-900">
            {delai.depasse
              ? `Le délai semble dépassé depuis ${-delai.joursRestants} jour${-delai.joursRestants > 1 ? "s" : ""}`
              : `Il vous resterait ${delai.joursRestants} jour${delai.joursRestants > 1 ? "s" : ""}`}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Calcul indicatif depuis le {formatDate(dossier?.date_envoi ?? null)}, soit jusqu&apos;au{" "}
            {formatDate(delai.limite)}. C&apos;est la mention de votre courrier qui fait foi.
            {delai.depasse && " Un délai dépassé n'est pas une impasse : appelez-nous."}
          </p>
        </Card>
      )}

      <div className="mt-8">
        <PayerOuContester />
      </div>

      <div className="mt-8 rounded-xl border border-gold-400 bg-gold-100/60 p-6 text-center">
        <p className="font-display text-base font-bold text-navy-900">
          Bloqué à une étape ? Un doute sur votre dossier ?
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-soft">
          Nous relisons votre situation avec vous, gratuitement et sans limite de dossiers.
        </p>
        <BoutonContact variante="gold" className="mt-4" />
      </div>
    </div>
  );
}

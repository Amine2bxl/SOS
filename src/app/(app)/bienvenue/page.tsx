import type { Metadata } from "next";
import Link from "next/link";
import { lireProfil } from "@/lib/dossiers";
import { PLANS, planById } from "@/lib/plans";
import { CarteFormule } from "@/components/formules";
import { LinkBtn } from "@/components/ui";
import { IconeFleche, IconeOk } from "@/components/icones";

export const metadata: Metadata = { title: "Bienvenue" };
export const dynamic = "force-dynamic";

/**
 * Juste après la création du compte : choisir sa formule, puis scanner sa
 * première lettre. Trois étapes affichées, deux boutons, rien d'autre.
 */
export default async function Bienvenue() {
  const profil = await lireProfil();
  const membre = profil && profil.plan !== "gratuit";
  const gratuit = PLANS[0];
  const membreFormule = planById("membre");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <ol aria-label="Étapes" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <Etape fait>Compte créé</Etape>
        <span className="hidden h-px w-6 bg-line sm:block" aria-hidden="true" />
        <Etape actif={!membre} fait={!!membre}>
          Votre formule
        </Etape>
        <span className="hidden h-px w-6 bg-line sm:block" aria-hidden="true" />
        <Etape actif={!!membre}>Votre lettre</Etape>
      </ol>

      <h1 className="mt-6 font-display text-[2rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">
        {membre ? "Vous êtes membre. Merci !" : "Votre compte est prêt."}
      </h1>

      {membre ? (
        <>
          <p className="mt-2 text-[1.05rem] text-ink-soft">Dernière étape : prenez votre lettre en photo.</p>
          <div className="mt-6">
            <LinkBtn href="/tableau-de-bord/nouveau" variant="gold" taille="lg">
              Scanner ma lettre
              <IconeFleche className="h-5 w-5" />
            </LinkBtn>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-[1.05rem] text-ink-soft">
            Choisissez votre formule. Modifiable à tout moment.
          </p>
          <div className="mt-7 grid items-start gap-5 md:grid-cols-2">
            <CarteFormule plan={gratuit} href="/tableau-de-bord/nouveau" libelleAction="Commencer gratuitement" />
            <CarteFormule plan={membreFormule} href="/adherer?formule=membre" libelleAction="Devenir membre — 70 € / an" />
          </div>
          <p className="mt-5 text-sm text-ink-soft">
            Indépendant ou société ?{" "}
            <Link href="/adherer?formule=independant" className="font-semibold text-navy-700 underline underline-offset-4">
              Indépendant (400 €)
            </Link>{" "}
            ou{" "}
            <Link href="/adherer?formule=societe" className="font-semibold text-navy-700 underline underline-offset-4">
              Société (800 €)
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function Etape({ children, fait = false, actif = false }: { children: React.ReactNode; fait?: boolean; actif?: boolean }) {
  return (
    <li
      aria-current={actif ? "step" : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 ${
        fait ? "bg-ok-100 text-ok-700" : actif ? "bg-navy-900 text-white" : "bg-navy-50 text-ink-soft"
      }`}
    >
      {fait && <IconeOk className="h-4 w-4" />}
      {children}
    </li>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { lireProfil, lireAdhesionEnAttente } from "@/lib/dossiers";
import { planById, PLANS } from "@/lib/plans";
import { LinkBtn } from "@/components/ui";
import { CarteFormule } from "@/components/formules";
import { InstructionsVirement } from "@/components/app/InstructionsVirement";
import { IconeBouclier, IconeLettre, IconeMainTendue, IconeSceau } from "@/components/icones";
import { FormulaireAdhesion } from "./FormulaireAdhesion";

export const metadata: Metadata = { title: "Devenir membre" };
export const dynamic = "force-dynamic";

const RAISONS = [
  { Icone: IconeLettre, titre: "Tous vos courriers, toute l'année", texte: "Dossiers illimités : chaque redevance, chaque rappel, chaque relance." },
  { Icone: IconeMainTendue, titre: "Une association derrière vous", texte: "Relecture de votre dossier par nos bénévoles, réponse prioritaire." },
  { Icone: IconeBouclier, titre: "Vous défendez tout le monde", texte: "Votre cotisation fait vivre l'association et l'aide qu'elle apporte à tous." },
];

export default async function Adherer({ searchParams }: { searchParams: Promise<{ formule?: string }> }) {
  const [{ formule }, profil, enAttente] = await Promise.all([searchParams, lireProfil(), lireAdhesionEnAttente()]);
  const choisie = PLANS.find((p) => p.id === formule && p.id !== "gratuit") ?? planById("membre");

  if (profil && profil.plan !== "gratuit") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:py-20">
        <section className="rounded-[1.75rem] border border-ok-600/30 bg-ok-50 p-7 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-navy-900">
            <IconeSceau className="h-10 w-10" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ok-700">Vous êtes membre</h1>
          <p className="mt-2 text-sm text-ink">
            Formule {planById(profil.plan).nom} active : vos dossiers sont illimités. Merci de soutenir l&apos;association.
          </p>
          <LinkBtn href="/tableau-de-bord" variant="secondary" className="mt-6">
            Retour à l&apos;accueil
          </LinkBtn>
        </section>
      </div>
    );
  }

  // Une demande déjà posée : on reprend là où la personne s'était arrêtée, avec
  // sa référence de paiement, plutôt que de lui faire recommencer.
  const formuleAffichee = enAttente ? planById(enAttente.formule) : choisie;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">SOS Citizens ASBL</p>
      <h1 className="mt-2 font-display text-[2rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">
        Devenir membre
      </h1>
      <p className="mt-2 max-w-xl text-[1.05rem] text-ink-soft">
        {formuleAffichee.prixAnnuel} € par an, sans engagement au-delà. Une redevance évitée, des frais de rappel en
        moins : l&apos;adhésion se rembourse vite.
      </p>

      <div className="mt-7 grid gap-5 md:grid-cols-[1fr_1.05fr] md:items-start">
        <CarteFormule plan={formuleAffichee} sansAction />
        <div>
          <ul className="space-y-3">
            {RAISONS.map(({ Icone, titre, texte }) => (
              <li key={titre} className="flex gap-3 rounded-2xl border border-line/80 bg-card p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
                  <Icone className="h-7 w-7" />
                </span>
                <span>
                  <span className="block font-bold text-navy-900">{titre}</span>
                  <span className="block text-sm leading-relaxed text-ink-soft">{texte}</span>
                </span>
              </li>
            ))}
          </ul>
          {!enAttente && formuleAffichee.id === "membre" && (
            <p className="mt-4 text-sm text-ink-soft">
              Indépendant ou entreprise ?{" "}
              <Link href="/tarifs" className="font-semibold text-navy-700 underline underline-offset-4">
                Voir les formules pro
              </Link>
            </p>
          )}
        </div>
      </div>

      {enAttente ? (
        <InstructionsVirement
          communication={enAttente.communication}
          montant={enAttente.montant}
          nomFormule={formuleAffichee.nom}
        />
      ) : (
        <FormulaireAdhesion formule={choisie.id} nomFormule={choisie.nom} prix={choisie.prixAnnuel} />
      )}
    </div>
  );
}

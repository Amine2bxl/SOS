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
  { Icone: IconeLettre, titre: "Tous vos courriers, toute l'année", texte: "Dossiers illimités : redevances, rappels, relances." },
  { Icone: IconeMainTendue, titre: "Une association derrière vous", texte: "Un bénévole relit votre dossier. Réponse prioritaire." },
  { Icone: IconeBouclier, titre: "Vous défendez tout le monde", texte: "Votre cotisation garde l'aide gratuite pour tous." },
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
        {formuleAffichee.prixAnnuel} € par an, sans engagement. Une redevance évitée et elle est remboursée.
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
          {!enAttente && (
            // Le choix de formule reste ici, dans l'espace membre : on ne
            // renvoie personne vers la page publique des tarifs pour s'abonner.
            <nav aria-label="Choisir une autre formule" className="mt-4">
              <p className="text-sm font-semibold text-navy-900">Particulier, indépendant ou société :</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {PLANS.filter((p) => p.id !== "gratuit").map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/adherer?formule=${p.id}`}
                      aria-current={p.id === formuleAffichee.id ? "page" : undefined}
                      className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
                        p.id === formuleAffichee.id
                          ? "border-navy-900 bg-navy-900 text-white"
                          : "border-line bg-card text-navy-900 hover:bg-navy-50"
                      }`}
                    >
                      {p.nom}
                      <span className={p.id === formuleAffichee.id ? "text-gold-300" : "text-ink-soft"}>{p.prixAnnuel} €</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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

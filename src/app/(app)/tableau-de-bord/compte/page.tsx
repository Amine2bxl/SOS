import type { Metadata } from "next";
import { lireUtilisateur } from "@/lib/supabase/server";
import { lireAdhesionEnAttente, lireProfil, listerDossiers } from "@/lib/dossiers";
import { contestationsRestantes, planById } from "@/lib/plans";
import { LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { IconeCadenas, IconePersonne, IconeSceau } from "@/components/icones";
import { FormulaireProfil } from "./FormulaireProfil";
import { SupprimerCompte } from "./SupprimerCompte";
import { BoutonDeconnexion } from "./BoutonDeconnexion";

export const metadata: Metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function MonCompte() {
  const [utilisateur, profil, dossiers, enAttente] = await Promise.all([
    lireUtilisateur(),
    lireProfil(),
    listerDossiers(),
    lireAdhesionEnAttente(),
  ]);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);
  const nomComplet = [profil?.prenom, profil?.nom].filter(Boolean).join(" ");
  const initiale = (profil?.prenom?.charAt(0) || utilisateur?.email?.charAt(0) || "?").toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-xl font-bold text-gold-400">
          {initiale}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[1.8rem] font-extrabold leading-tight text-navy-900">
            {nomComplet || "Mon compte"}
          </h1>
          <p className="truncate text-ink-soft">{utilisateur?.email}</p>
        </div>
      </header>

      {/* --------------------------------------------------------- adhésion */}
      <section className="relative mt-6 overflow-hidden rounded-[var(--radius-carte)] bg-navy-900 p-5 text-white shadow-carte sm:p-6">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-navy-900">
              <IconeSceau className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">Votre formule</p>
              <p className="font-display text-xl font-bold">{plan.id === "gratuit" ? "Découverte" : `Formule ${plan.nom}`}</p>
              <p className="text-sm text-navy-100">
                {plan.id !== "gratuit"
                  ? "Dossiers illimités. Merci de soutenir l'association."
                  : enAttente
                    ? `Adhésion demandée : virement de ${enAttente.montant} € en attente.`
                    : `${restantes ?? 0} dossier${(restantes ?? 0) > 1 ? "s" : ""} offert${(restantes ?? 0) > 1 ? "s" : ""} restant${(restantes ?? 0) > 1 ? "s" : ""}.`}
              </p>
            </div>
          </div>
          {plan.id === "gratuit" && (
            <LinkBtn href="/adherer" variant="gold">
              {enAttente ? "Voir le virement" : "Adhérer — 70 € / an"}
            </LinkBtn>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------ coordonnées */}
      <section className="mt-4 rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
            <IconePersonne className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">Vos coordonnées</h2>
            <p className="text-sm text-ink-soft">Saisies une fois, elles s&apos;inscrivent dans chaque lettre.</p>
          </div>
        </div>
        <FormulaireProfil
          prenom={profil?.prenom ?? ""}
          nom={profil?.nom ?? ""}
          telephone={profil?.telephone ?? ""}
          adresse={profil?.adresse ?? ""}
          codePostal={profil?.code_postal ?? ""}
          commune={profil?.commune ?? ""}
        />
      </section>

      {/* ----------------------------------------------------------- données */}
      <section className="mt-4 rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
            <IconeCadenas className="h-7 w-7" />
          </span>
          <h2 className="font-display text-lg font-bold text-navy-900">Vos données</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-soft">
          <li>Vos courriers sont lus sur votre appareil : l&apos;image ou le PDF n&apos;est envoyé nulle part.</li>
          <li>Le texte lu sur un courrier est effacé automatiquement au bout de six mois.</li>
          <li>Vos données ne servent qu&apos;à vos dossiers. Elles ne sont ni vendues, ni partagées.</li>
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <BoutonDeconnexion />
          <SupprimerCompte dossiers={dossiers.length} />
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-ink-soft">
        Une question sur votre compte ? <BoutonContact variante="lien">Écrivez-nous</BoutonContact>
      </p>
    </div>
  );
}

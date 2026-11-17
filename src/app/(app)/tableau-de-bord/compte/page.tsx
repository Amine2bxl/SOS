import type { Metadata } from "next";
import Link from "next/link";
import { lireAdhesionEnAttente, lireProfil, listerDossiers } from "@/lib/dossiers";
import { contestationsRestantes, planById } from "@/lib/plans";
import { LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { IconeCadenas, IconePersonne, IconeSceau, IconeTelecharger } from "@/components/icones";
import { creerClientServeur, lireUtilisateur } from "@/lib/supabase/server";
import { FormulaireProfil } from "./FormulaireProfil";
import { SupprimerCompte } from "./SupprimerCompte";
import { BoutonDeconnexion } from "./BoutonDeconnexion";
import { AppareilsReconnus, type Appareil } from "./AppareilsReconnus";
import { PreferencesRappels } from "./PreferencesRappels";
import { emailAffichable } from "@/lib/telephone";
import { cookies } from "next/headers";
import { COOKIE_APPAREIL } from "@/lib/appareils";

export const metadata: Metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function MonCompte() {
  const [utilisateur, profil, dossiers, enAttente, consentements, appareils] = await Promise.all([
    lireUtilisateur(),
    lireProfil(),
    listerDossiers(),
    lireAdhesionEnAttente(),
    lireConsentements(),
    lireAppareils(),
  ]);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);
  const nomComplet = [profil?.prenom, profil?.nom].filter(Boolean).join(" ");
  const contact =
    emailAffichable(utilisateur?.email) ?? (utilisateur?.phone ? `+${utilisateur.phone.replace(/^\+/, "")}` : null);
  const initiale = (profil?.prenom?.charAt(0) || contact?.charAt(0) || "?").toUpperCase();

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
          <p className="truncate text-ink-soft">{contact}</p>
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
          typeCompte={profil?.type_compte === "organisation" ? "organisation" : "particulier"}
          organisation={profil?.organisation ?? ""}
          langueInterface={profil?.langue_interface ?? "fr"}
        />
      </section>

      {/* ---------------------------------------------------------- rappels */}
      <section className="mt-4 rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Vos rappels</h2>
        <p className="mt-1 text-sm text-ink-soft">En plus de l&apos;agenda : nous vous prévenons avant chaque date importante.</p>
        <div className="mt-4">
          <PreferencesRappels
            email={(profil as { rappels_email?: boolean } | null)?.rappels_email !== false}
            sms={(profil as { rappels_sms?: boolean } | null)?.rappels_sms === true}
            aTelephone={!!profil?.telephone}
          />
        </div>
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
          <li>Un bénévole de l&apos;association ne voit un dossier que si vous lui donnez mandat, depuis la fiche du dossier.</li>
        </ul>

        <div className="mt-5 rounded-2xl bg-paper p-4">
          <h3 className="font-semibold text-navy-900">Vos droits</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Accès, rectification, effacement, portabilité : tout se fait d&apos;ici. Pour le reste — opposition,
            limitation, question — écrivez-nous ; nous répondons dans le mois. Vous pouvez aussi saisir
            l&apos;Autorité de protection des données.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href="/api/mes-donnees"
              download
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-navy-900 transition hover:border-navy-200 hover:bg-navy-50"
            >
              <IconeTelecharger className="h-4 w-4" />
              Télécharger mes données
            </a>
            <span className="text-xs text-ink-faint">Un fichier JSON : profil, dossiers, lettres, historique, mandats.</span>
          </div>
          {consentements.length > 0 && (
            <p className="mt-3 text-xs text-ink-faint">
              Accepté :{" "}
              {consentements
                .map((c) => `${c.document === "cgu" ? "conditions" : "confidentialité"} ${c.version} le ${new Date(c.accepte_le).toLocaleDateString("fr-BE")}`)
                .join(" · ")}
            </p>
          )}
        </div>
        <div className="mt-5">
          <h3 className="font-semibold text-navy-900">Appareils où vous entrez sans code</h3>
          <div className="mt-2">
            <AppareilsReconnus appareils={appareils} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <BoutonDeconnexion />
          <SupprimerCompte dossiers={dossiers.length} />
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-ink-soft">
        Une question ?{" "}
        <Link href="/tableau-de-bord/aide" className="font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4">
          Aide
        </Link>{" "}
        · <BoutonContact variante="lien">Écrivez-nous</BoutonContact>
      </p>
    </div>
  );
}

/** Les acceptations enregistrées, les plus récentes d'abord ; vide si la table manque. */
async function lireConsentements(): Promise<{ document: string; version: string; accepte_le: string }[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consentements")
    .select("document, version, accepte_le")
    .order("accepte_le", { ascending: false })
    .limit(4);
  return error ? [] : (data ?? []);
}

/** Les appareils reconnus du compte ; vide si la table n'existe pas encore. */
async function lireAppareils(): Promise<Appareil[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("appareils_reconnus")
    .select("id, libelle, utilise_le, expire_le, revoque_le")
    .is("revoque_le", null)
    .gt("expire_le", new Date().toISOString())
    .order("utilise_le", { ascending: false });
  if (error) return [];
  const actuel = (await cookies()).get(COOKIE_APPAREIL)?.value?.split(".")[0];
  return (data ?? []).map((a) => ({ id: a.id, libelle: a.libelle, utilise_le: a.utilise_le, actuel: a.id === actuel }));
}

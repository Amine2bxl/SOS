"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Logo, MarqueSos } from "@/components/Logo";
import { ICONES, IconeScanDoc, IconeSortie } from "@/components/icones";
import { MODULES, moduleActif, type Module } from "@/components/app/modules";
import { seDeconnecter } from "@/lib/auth-actions";

export type InfosMembre = {
  prenom: string;
  nom: string;
  email: string | null;
  initiale: string;
  planNom: string;
  /** null = illimité */
  contestationsRestantes: number | null;
  estGratuit: boolean;
};

/**
 * La coquille de l'espace membre.
 *
 * Sur ordinateur, une barre latérale claire : la marque, le bouton qui compte
 * (« Nouveau courrier »), quatre destinations, et l'état de l'adhésion.
 * Sur téléphone, une barre d'onglets en bas d'écran, là où tombe le pouce,
 * avec le scan au centre — c'est le geste qu'on vient faire.
 */
export function CoquilleApp({ membre, children }: { membre: InfosMembre; children: React.ReactNode }) {
  const chemin = usePathname();
  const actif = moduleActif(chemin);
  const [deconnexion, demarrer] = useTransition();
  const principal = MODULES.find((m) => m.principal)!;
  const destinations = MODULES.filter((m) => !m.principal);

  const sortir = () => demarrer(() => seDeconnecter());

  return (
    <div className="flex min-h-screen flex-1 bg-paper">
      {/* ------------------------------------------------ barre latérale */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-card lg:flex">
        <div className="px-5 pb-4 pt-6">
          <Link href="/tableau-de-bord" aria-label="Accueil de mon espace">
            <Logo surClair />
          </Link>
        </div>

        <div className="px-4">
          <Link
            href={principal.href}
            className="flex h-12 items-center justify-center gap-2.5 rounded-full bg-gold-400 font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300 active:scale-[0.98]"
          >
            <IconeScanDoc className="h-5 w-5 [--icone-accent:transparent]" />
            {principal.titre}
          </Link>
        </div>

        <nav aria-label="Navigation de l'espace membre" className="mt-6 flex-1 space-y-1 px-3">
          {destinations.map((m) => (
            <LienLateral key={m.href} module={m} actif={actif?.href === m.href} />
          ))}
        </nav>

        <div className="space-y-3 p-4">
          <EtatAdhesion membre={membre} />
          <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold-400">
              {membre.initiale}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-navy-900">
                {[membre.prenom, membre.nom].filter(Boolean).join(" ") || "Mon compte"}
              </span>
              <span className="block truncate text-xs text-ink-soft">{membre.email}</span>
            </span>
            <button
              type="button"
              onClick={sortir}
              disabled={deconnexion}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="rounded-full p-2 text-ink-soft transition hover:bg-navy-50 hover:text-navy-900"
            >
              <IconeSortie className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---------------------------------------- barre du haut (téléphone) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <Link href="/tableau-de-bord" aria-label="Accueil de mon espace" className="flex items-center gap-2">
            <MarqueSos className="h-8 w-8" />
            <span className="font-display text-base font-bold text-navy-900">
              {actif?.titre ?? "Mon espace"}
            </span>
          </Link>
          <Link
            href="/tableau-de-bord/compte"
            aria-label="Mon compte"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold-400"
          >
            {membre.initiale}
          </Link>
        </header>

        <main id="contenu" className="flex-1 pb-28 lg:pb-12">
          {children}
        </main>

        {/* ------------------------------------- barre d'onglets (téléphone) */}
        <nav
          aria-label="Navigation de l'espace membre"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
            {MODULES.map((m) => (
              <li key={m.href} className="flex justify-center">
                <OngletMobile module={m} actif={actif?.href === m.href} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function LienLateral({ module, actif }: { module: Module; actif: boolean }) {
  const Icone = ICONES[module.icone];
  return (
    <Link
      href={module.href}
      aria-current={actif ? "page" : undefined}
      title={module.phrase}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[0.95rem] font-semibold transition ${
        actif ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"
      }`}
    >
      <Icone className={`h-6 w-6 ${actif ? "text-white" : "text-navy-900"}`} />
      {module.titre}
    </Link>
  );
}

function OngletMobile({ module, actif }: { module: Module; actif: boolean }) {
  const Icone = ICONES[module.icone];
  if (module.principal) {
    return (
      <Link
        href={module.href}
        aria-current={actif ? "page" : undefined}
        className="-mt-5 flex flex-col items-center gap-1 pb-2"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-navy-950 shadow-flotte ring-4 ring-card transition active:scale-95">
          <Icone className="h-7 w-7 [--icone-accent:transparent]" />
        </span>
        <span className="text-[11px] font-bold text-navy-900">{module.court}</span>
      </Link>
    );
  }
  return (
    <Link
      href={module.href}
      aria-current={actif ? "page" : undefined}
      className={`flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 ${actif ? "text-navy-900" : "text-ink-soft"}`}
    >
      <Icone className={`h-6 w-6 ${actif ? "" : "[--icone-accent:transparent] opacity-80"}`} />
      <span className={`text-[11px] ${actif ? "font-bold" : "font-medium"}`}>{module.court}</span>
    </Link>
  );
}

function EtatAdhesion({ membre }: { membre: InfosMembre }) {
  if (!membre.estGratuit) {
    return (
      <div className="rounded-2xl bg-navy-900 p-4 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-gold-400">Membre</p>
        <p className="mt-1 text-sm text-navy-100">Formule {membre.planNom} — dossiers illimités.</p>
      </div>
    );
  }
  const restantes = membre.contestationsRestantes ?? 0;
  return (
    <div className="rounded-2xl border border-gold-300 bg-gold-50 p-4">
      <p className="text-sm font-bold text-navy-900">
        {restantes > 0
          ? `${restantes} dossier${restantes > 1 ? "s" : ""} offert${restantes > 1 ? "s" : ""}`
          : "Dossiers offerts utilisés"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Membre : illimité, relecture par l&apos;association, alertes.
      </p>
      <Link
        href="/adherer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-navy-900 underline decoration-gold-500 decoration-2 underline-offset-4"
      >
        Adhérer — 70 € / an
      </Link>
    </div>
  );
}

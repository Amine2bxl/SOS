"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Logo } from "@/components/Logo";
import { BoutonContact } from "@/components/Contact";
import { IconeModule } from "@/components/app/IconeModule";
import {
  MODULES_COMPTE,
  MODULES_DOSSIERS,
  MODULES_OUTILS,
  moduleActif,
  type Module,
} from "@/components/app/modules";
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

function LienModule({
  module,
  actif,
  onNavigue,
}: {
  module: Module;
  actif: boolean;
  onNavigue?: () => void;
}) {
  return (
    <Link
      href={module.href}
      onClick={onNavigue}
      aria-current={actif ? "page" : undefined}
      title={module.phrase}
      className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition ${
        actif
          ? "bg-navy-800 text-white shadow-inner"
          : "text-navy-100 hover:bg-navy-800/60 hover:text-white"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 ${actif ? "text-gold-400" : "text-navy-100/60 group-hover:text-gold-300"}`}
      >
        <IconeModule nom={module.icone} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{module.titre}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-navy-100/60">
          {module.phrase}
        </span>
      </span>
    </Link>
  );
}

function GroupeModules({
  titre,
  modules,
  chemin,
  onNavigue,
}: {
  titre: string;
  modules: Module[];
  chemin: string;
  onNavigue?: () => void;
}) {
  const actif = moduleActif(chemin);
  return (
    <div>
      <p className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-navy-100/45">
        {titre}
      </p>
      <div className="grid gap-0.5">
        {modules.map((m) => (
          <LienModule key={m.href} module={m} actif={actif?.href === m.href} onNavigue={onNavigue} />
        ))}
      </div>
    </div>
  );
}

/** Contenu de la barre latérale, partagé entre le bureau et le tiroir mobile. */
function ContenuLateral({
  membre,
  chemin,
  onNavigue,
}: {
  membre: InfosMembre;
  chemin: string;
  onNavigue?: () => void;
}) {
  const [enCours, demarrer] = useTransition();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-navy-800 px-4 py-4">
        <Link href="/tableau-de-bord" onClick={onNavigue} aria-label="Mon espace SOS Citizens">
          <Logo />
        </Link>
      </div>

      <nav aria-label="Modules de mon espace" className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <GroupeModules titre="Mes dossiers" modules={MODULES_DOSSIERS} chemin={chemin} onNavigue={onNavigue} />
        <GroupeModules titre="Mes outils" modules={MODULES_OUTILS} chemin={chemin} onNavigue={onNavigue} />
        <GroupeModules titre="Mon compte" modules={MODULES_COMPTE} chemin={chemin} onNavigue={onNavigue} />
      </nav>

      <div className="space-y-2 border-t border-navy-800 px-3 py-3">
        {membre.estGratuit && (
          <Link
            href="/tableau-de-bord/abonnement"
            onClick={onNavigue}
            className="block rounded-lg bg-gold-400/10 p-3 ring-1 ring-gold-400/30 transition hover:bg-gold-400/20"
          >
            <p className="text-sm font-bold text-gold-300">Devenir membre</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-navy-100/70">
              Contestations illimitées et relecture de vos lettres par l&apos;association.
            </p>
          </Link>
        )}
        <Link
          href="/"
          onClick={onNavigue}
          className="block rounded-lg px-3 py-2 text-[12.5px] font-medium text-navy-100/70 transition hover:bg-navy-800/60 hover:text-white"
        >
          ← Revenir au site public
        </Link>
        <button
          type="button"
          disabled={enCours}
          onClick={() => demarrer(async () => void (await seDeconnecter()))}
          className="w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold text-danger-100/90 transition hover:bg-danger-700/40 disabled:opacity-50"
        >
          {enCours ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}

/** Menu du compte, à droite de la barre supérieure. */
function MenuMembre({ membre }: { membre: InfosMembre }) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, demarrer] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label="Menu de mon compte"
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-2.5 transition hover:border-navy-600/40"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-black text-gold-300">
          {membre.initiale}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold text-navy-900 sm:inline">
          {membre.prenom || "Mon compte"}
        </span>
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOuvert(false)} />
          <div
            role="menu"
            className="animate-rise absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-card shadow-2xl"
          >
            <div className="border-b border-line-soft bg-navy-50/60 px-4 py-3">
              <p className="truncate font-display text-sm font-bold text-navy-900">
                {[membre.prenom, membre.nom].filter(Boolean).join(" ") || "Mon compte"}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-soft">{membre.email ?? ""}</p>
            </div>
            <div className="p-1.5">
              {MODULES_COMPTE.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  role="menuitem"
                  onClick={() => setOuvert(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
                >
                  {m.titre}
                </Link>
              ))}
            </div>
            <div className="border-t border-line-soft p-1.5">
              <button
                type="button"
                role="menuitem"
                disabled={enCours}
                onClick={() => demarrer(async () => void (await seDeconnecter()))}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-danger-700 transition hover:bg-danger-100 disabled:opacity-50"
              >
                {enCours ? "…" : "Se déconnecter"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Coquille de l'espace membre.
 *
 * C'est ici que le site devient une application : barre latérale persistante
 * qui nomme et explique chaque module, barre supérieure qui rappelle où l'on
 * est et sous quelle formule, aucun contenu marketing. Le site public a sa
 * propre coquille — on ne mélange plus les deux.
 */
export function CoquilleApp({
  membre,
  children,
}: {
  membre: InfosMembre;
  children: React.ReactNode;
}) {
  const chemin = usePathname();
  const [tiroir, setTiroir] = useState(false);
  const actif = moduleActif(chemin);

  return (
    <div className="flex min-h-screen flex-1 bg-paper">
      {/* Barre latérale — bureau */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-navy-800 bg-navy-950 lg:block print:hidden">
        <ContenuLateral membre={membre} chemin={chemin} />
      </aside>

      {/* Tiroir — mobile */}
      {tiroir && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setTiroir(false)}
          />
          <div className="animate-rise absolute inset-y-0 left-0 w-[19rem] max-w-[85%] bg-navy-950 shadow-2xl">
            <ContenuLateral membre={membre} chemin={chemin} onNavigue={() => setTiroir(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure */}
        <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-3 px-3 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={() => setTiroir(true)}
              aria-label="Ouvrir le menu de mon espace"
              className="rounded-md border border-line p-2 text-navy-900 lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                Espace membre
              </p>
              <h1 className="truncate font-display text-base font-bold leading-tight text-navy-900 sm:text-lg">
                {actif?.titre ?? "Mon espace"}
              </h1>
            </div>

            <Link
              href="/tableau-de-bord/abonnement"
              className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition sm:inline-flex ${
                membre.estGratuit
                  ? "bg-gold-400 text-navy-950 hover:bg-gold-300"
                  : "bg-navy-50 text-navy-900 hover:bg-navy-100"
              }`}
            >
              {membre.estGratuit ? "Devenir membre" : membre.planNom}
              {membre.contestationsRestantes !== null && (
                <span className="font-medium text-navy-950/70">
                  {membre.contestationsRestantes} restante
                  {membre.contestationsRestantes > 1 ? "s" : ""}
                </span>
              )}
            </Link>

            <BoutonContact variante="secondaire" className="hidden px-3 py-2 md:inline-flex" />
            <MenuMembre membre={membre} />
          </div>
        </header>

        <main id="contenu" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { genererIcs } from "@/cerveau/moteur/agenda";
import { lienAbonnementGoogle, lienGoogle, lienOutlook, type EvenementCalendrier } from "@/lib/agenda";
import { CopierTexte } from "@/components/CopierTexte";
import { Btn } from "@/components/ui";
import { IconeAgenda, IconeChevron } from "@/components/icones";
import { activerAbonnementAgenda } from "@/lib/agenda-actions";

/**
 * « Ajouter à mon agenda » : Google, Outlook, ou le fichier universel (.ics)
 * qu'ouvrent l'iPhone, Android et tous les agendas. Un menu, trois choix.
 */
export function AjouterAgenda({ ev, site }: { ev: EvenementCalendrier; site: string }) {
  const telecharger = () => {
    const ics = genererIcs({
      uid: ev.id,
      titre: ev.titre,
      date: ev.date,
      description: [ev.detail, ev.lien ? `${site}${ev.lien}` : null].filter(Boolean).join("\n\n"),
      url: ev.lien ? `${site}${ev.lien}` : undefined,
      rappels: ev.type === "echeance" ? [3, 1, 0] : [1],
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `sos-citizens-${ev.date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <details className="group relative">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold text-navy-900 transition hover:bg-navy-50">
        <IconeAgenda className="h-4 w-4" />
        Ajouter
        <IconeChevron className="h-3 w-3 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-2xl border border-line bg-card p-1 shadow-flotte">
        <a href={lienGoogle(ev, site)} target="_blank" rel="noopener noreferrer" className="block rounded-xl px-3 py-2 text-sm text-navy-900 hover:bg-navy-50">
          Google Agenda
        </a>
        <a href={lienOutlook(ev, site)} target="_blank" rel="noopener noreferrer" className="block rounded-xl px-3 py-2 text-sm text-navy-900 hover:bg-navy-50">
          Outlook
        </a>
        <button type="button" onClick={telecharger} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-navy-900 hover:bg-navy-50">
          iPhone, Android, autre (.ics)
        </button>
      </div>
    </details>
  );
}

/**
 * L'abonnement : une adresse secrète que l'agenda du téléphone relit seul.
 * Toutes les dates des dossiers y arrivent, et s'y mettent à jour.
 */
export function AbonnementAgenda({ jeton: initial, site }: { jeton: string | null; site: string }) {
  const [jeton, setJeton] = useState(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const url = jeton ? `${site}/api/agenda/${jeton}.ics` : null;

  const activer = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await activerAbonnementAgenda();
    setEnCours(false);
    if (r.erreur) return setErreur(r.erreur);
    if (r.jeton) setJeton(r.jeton);
  };

  return (
    <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
      <h2 className="font-display text-lg font-bold text-navy-900">Tout dans l&apos;agenda de votre téléphone</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        Abonnez-vous une fois : dates limites et relances arrivent seules dans votre agenda, avec rappel.
      </p>
      {!url ? (
        <Btn variant="primary" taille="sm" className="mt-4" onClick={activer} disabled={enCours}>
          {enCours ? "Activation…" : "Activer l'abonnement"}
        </Btn>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <a
              href={lienAbonnementGoogle(url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white transition hover:bg-navy-800"
            >
              Ajouter à Google Agenda
            </a>
            <a
              href={url.replace(/^https?:/, "webcal:")}
              className="flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-navy-900 transition hover:bg-navy-50"
            >
              iPhone, iPad, Mac
            </a>
            <a
              href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(url)}&name=${encodeURIComponent("SOS Citizens")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-navy-900 transition hover:bg-navy-50"
            >
              Outlook
            </a>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-paper p-2.5">
            <code className="min-w-0 flex-1 truncate text-xs text-ink-soft">{url}</code>
            <CopierTexte valeur={url} libelle="Copier l'adresse de l'agenda" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Adresse personnelle : ne la partagez pas.{" "}
            <button type="button" onClick={activer} className="font-semibold underline underline-offset-2">
              Changer d&apos;adresse
            </button>{" "}
            si vous l&apos;avez donnée par erreur.
          </p>
        </>
      )}
      {erreur && (
        <p role="alert" className="mt-2 text-sm text-danger-700">
          {erreur}
        </p>
      )}
    </section>
  );
}

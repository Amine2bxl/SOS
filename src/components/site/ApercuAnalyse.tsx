/**
 * L'image de la page d'accueil : un courrier, et ce que le moteur en tire.
 *
 * Pas de capture d'écran ni de photo d'illustration : le visuel est construit
 * avec les mêmes pièces que l'application (le ticket, la plaque, le compte à
 * rebours). Ce qu'on montre est exactement ce qu'on obtient.
 */

import { CompteARebours } from "@/components/dossier-ui";
import { Plaque } from "@/components/ui";
import { IconeAppMobile, IconeCerveau, IconeLettre } from "@/components/icones";

export function ApercuAnalyse() {
  return (
    <div className="relative mx-auto h-[25rem] w-full max-w-[26rem] sm:h-[27rem]" aria-hidden="true">
      {/* Le courrier reçu */}
      <div className="absolute left-0 top-2 w-[78%] -rotate-[4deg] rounded-2xl bg-white p-5 text-ink shadow-flotte">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-700">parking.brussels</span>
          <span className="rounded bg-danger-100 px-1.5 py-0.5 text-[9px] font-bold text-danger-700">À PAYER</span>
        </div>
        <p className="mt-3 font-display text-base font-bold text-navy-900">Redevance de stationnement</p>
        <div className="mt-3 w-2/5">
          <p className="text-[10px] uppercase tracking-wide text-ink-faint">Montant</p>
          <p className="font-display text-xl font-extrabold text-navy-900">35,00 €</p>
          <Plaque valeur="1-ABC-123" className="mt-2" />
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-line" />
          <div className="h-1.5 w-4/5 rounded bg-line" />
          <div className="h-1.5 w-1/2 rounded bg-line" />
        </div>
      </div>

      {/* Ce que le moteur en tire */}
      <div className="absolute bottom-0 right-0 w-[80%] rotate-[2deg] overflow-hidden rounded-2xl bg-white shadow-flotte ring-1 ring-black/5">
        <div className="motif-marquage h-1.5" />
        <div className="p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold-700">
            <IconeCerveau className="h-5 w-5 text-navy-900" />
            Analyse SOS
          </p>
          <div className="mt-3 flex items-center gap-3">
            <CompteARebours jours={6} />
            <div>
              <p className="font-display text-lg font-extrabold leading-tight text-navy-900">Contester</p>
              <p className="text-xs text-ink-soft">avant le délai de 10 jours</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-ok-50 p-2.5">
            <IconeAppMobile className="h-7 w-7 shrink-0 text-navy-900" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ok-700">Argument solide</p>
              <p className="truncate text-xs font-semibold text-navy-900">Ma session était active</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-paper p-2.5">
            <IconeLettre className="h-7 w-7 shrink-0 text-navy-900" />
            <p className="text-xs font-semibold text-navy-900">Lettre prête · français ou néerlandais</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { COMMUNES } from "@/lib/data";
import { creerClientNavigateur } from "@/lib/supabase/client";
import {
  aujourdhuiBruxelles,
  champsModifies,
  changementsRecents,
  communesModifiees,
  dateLisible,
  differences,
  ficheCommune,
  heureBruxelles,
  trouverCommune,
  type ChampFiche,
  type Changement,
  type Importance,
  type ReglesEnDirect,
} from "@/lib/communes-regles";
import { CarteBruxelles } from "@/components/CarteBruxelles";
import { Pastille, type TonPastille } from "@/components/ui";
import { IconeLien, IconeRecherche } from "@/components/icones";

const NOMS = Object.fromEntries(COMMUNES.map((c) => [c.slug, c.nom]));

/** Ce que la base vient de changer, signalé quelques secondes. */
type ALInstant = { communes: Set<string>; changements: Set<string>; champs: Record<string, ChampFiche[]> };
const RIEN_DE_NEUF: ALInstant = { communes: new Set(), changements: new Set(), champs: {} };

const IMPORTANCE: Record<Importance, { ton: TonPastille; etiquette: string }> = {
  urgent: { ton: "danger", etiquette: "La règle a changé" },
  important: { ton: "attention", etiquette: "À savoir" },
  info: { ton: "neutre", etiquette: "Information" },
};

/**
 * Suit la base pendant que la page est ouverte : une règle corrigée, un
 * changement ajouté, et la page se met à jour d'elle-même — la fiche, les
 * repères jaunes de la carte, le journal.
 *
 * Écoute en temps réel tant que l'onglet est visible ; onglet masqué, la
 * connexion est rendue, et la page se relit au retour si elle a pu manquer
 * quelque chose.
 */
function useSuivreLaBase() {
  const router = useRouter();

  useEffect(() => {
    const supabase = creerClientNavigateur();
    let canal: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    let masqueeDepuis = 0;

    // Une modification en série (19 fiches d'un coup) ne relit la page qu'une fois.
    const relire = () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => router.refresh(), 500);
    };
    const ecouter = () => {
      if (!supabase || canal) return;
      canal = supabase.channel("regles-des-communes");
      for (const table of ["communes_regles", "regles_changements", "communes"]) {
        canal.on("postgres_changes", { event: "*", schema: "public", table }, relire);
      }
      canal.subscribe();
    };
    const arreter = () => {
      if (supabase && canal) supabase.removeChannel(canal);
      canal = null;
    };
    const surVisibilite = () => {
      if (document.visibilityState === "visible") {
        ecouter();
        if (masqueeDepuis && Date.now() - masqueeDepuis > 15_000) relire();
      } else {
        masqueeDepuis = Date.now();
        arreter();
      }
    };

    if (document.visibilityState === "visible") ecouter();
    document.addEventListener("visibilitychange", surVisibilite);
    return () => {
      document.removeEventListener("visibilitychange", surVisibilite);
      clearTimeout(minuteur);
      arreter();
    };
  }, [router]);
}

/** Un repère de la fiche : une étiquette, une phrase. Surligné quand il vient de changer. */
function Repere({ label, valeur, vientDeChanger = false }: { label: string; valeur: string; vientDeChanger?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-3.5 transition-colors duration-700 ${
        vientDeChanger ? "border-gold-400 bg-gold-50" : "border-line-soft bg-paper"
      }`}
    >
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        {label}
        {vientDeChanger && <span className="normal-case tracking-normal text-gold-700">· modifié</span>}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{valeur}</p>
    </div>
  );
}

function LigneChangement({ c, nouveau, commune }: { c: Changement; nouveau: boolean; commune?: ReactNode }) {
  const imp = IMPORTANCE[c.importance];
  return (
    <li className={`rounded-2xl border p-3.5 ${nouveau ? "border-gold-400 bg-gold-50" : "border-line-soft bg-paper"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Pastille ton={imp.ton}>{imp.etiquette}</Pastille>
        {commune}
        <span className="text-xs text-ink-soft">{dateLisible(c.publieLe)}</span>
        {nouveau && <Pastille ton="signal">À l&apos;instant</Pastille>}
      </div>
      <p className="mt-2 text-sm font-bold text-navy-900">{c.titre}</p>
      {c.resume && <p className="mt-1 text-sm leading-relaxed text-ink">{c.resume}</p>}
      {c.sourceUrl && (
        <a
          href={c.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy-700 underline"
        >
          Source officielle <IconeLien className="h-3 w-3" />
        </a>
      )}
    </li>
  );
}

/**
 * Explorateur des 19 communes : la carte de Bruxelles, la fiche de la commune
 * choisie, et ce qui a changé. Les règles viennent de la base, lues à chaque
 * visite et suivies en direct ; à défaut, des repères de référence du site.
 */
export function ExplorateurCommunes({ direct, slugInitial }: { direct: ReglesEnDirect; slugInitial?: string }) {
  useSuivreLaBase();

  const recents = useMemo(() => changementsRecents(direct.changements, direct.aujourdhui), [direct]);
  const modifiees = useMemo(() => communesModifiees(recents), [recents]);
  const fermees = useMemo(
    () => new Set(Object.entries(direct.registre).flatMap(([slug, r]) => (r.ouverte ? [] : [slug]))),
    [direct],
  );

  // À l'arrivée : la commune demandée, sinon la dernière à avoir changé, sinon le centre-ville.
  const [slug, setSlug] = useState(
    () => slugInitial ?? recents.find((c) => c.slug && NOMS[c.slug])?.slug ?? "bruxelles-ville",
  );
  const [recherche, setRecherche] = useState("");

  // Ce que la base vient de changer pendant que la page était ouverte : signalé
  // quelques secondes, sur la carte comme dans la fiche.
  const [lecturePrecedente, setLecturePrecedente] = useState(direct);
  const [aLInstant, setALInstant] = useState(RIEN_DE_NEUF);
  if (direct !== lecturePrecedente) {
    setLecturePrecedente(direct);
    const diff = differences(lecturePrecedente, direct);
    if (diff.communes.size || diff.changements.size) {
      const champs: Record<string, ChampFiche[]> = {};
      for (const c of COMMUNES) {
        if (!diff.communes.has(c.slug)) continue;
        champs[c.slug] = champsModifies(ficheCommune(c, lecturePrecedente), ficheCommune(c, direct));
      }
      setALInstant({ ...diff, champs });
    }
  }
  useEffect(() => {
    if (aLInstant === RIEN_DE_NEUF) return;
    const t = setTimeout(() => setALInstant(RIEN_DE_NEUF), 12_000);
    return () => clearTimeout(t);
  }, [aLInstant]);

  const commune = COMMUNES.find((c) => c.slug === slug) ?? COMMUNES[0];
  const fiche = ficheCommune(commune, direct);
  const changementsCommune = direct.changements.filter((c) => c.slug === commune.slug).slice(0, 5);
  const regionaux = recents.filter((c) => !c.slug && c.importance !== "info").slice(0, 2);
  const estPageGenerale = fiche.parking.includes("reglementations/par-commune");
  const neuf = (champ: ChampFiche) => aLInstant.champs[commune.slug]?.includes(champ) ?? false;

  const choisir = (nouveau: string) => {
    setSlug(nouveau);
    // L'adresse suit la commune choisie : un lien partagé rouvre la même fiche.
    window.history.replaceState(null, "", `/communes?commune=${nouveau}`);
  };

  const chercher = (texte: string) => {
    setRecherche(texte);
    const trouvee = trouverCommune(COMMUNES, texte);
    if (trouvee && trouvee.slug !== slug) choisir(trouvee.slug);
  };

  const misAJour = fiche.misAJourLe
    ? aujourdhuiBruxelles(new Date(fiche.misAJourLe)) === direct.aujourdhui
      ? `mise à jour aujourd'hui à ${heureBruxelles(fiche.misAJourLe)}`
      : `mise à jour le ${dateLisible(aujourdhuiBruxelles(new Date(fiche.misAJourLe)))}`
    : null;

  return (
    <div className="mt-8">
      {regionaux.map((c) => (
        <div
          key={c.id}
          role="status"
          className={`mb-5 rounded-[var(--radius-carte)] border-l-4 p-4 sm:p-5 ${
            c.importance === "urgent" ? "border-danger-600 bg-danger-50" : "border-warn-600 bg-warn-100"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Pastille ton={IMPORTANCE[c.importance].ton}>Toute la Région</Pastille>
            <span className="text-xs text-ink-soft">depuis le {dateLisible(c.publieLe)}</span>
            {aLInstant.changements.has(c.id) && <Pastille ton="signal">À l&apos;instant</Pastille>}
          </div>
          <p className="mt-2 font-display text-base font-bold text-navy-900">{c.titre}</p>
          {c.resume && <p className="mt-1 text-sm leading-relaxed text-ink">{c.resume}</p>}
        </div>
      ))}

      {/* Annonce la fiche ouverte aux lecteurs d'écran, sans voler le focus. */}
      <p className="sr-only" aria-live="polite">
        Fiche affichée : {commune.nom}
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:items-start">
        {/* La carte : elle reste à l'écran pendant la lecture de la fiche, sur les
            écrans assez hauts pour la montrer entière — recherche comprise. */}
        <section
          aria-labelledby="titre-carte"
          className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-4 shadow-carte sm:p-5 lg:top-24 lg:[@media(min-height:880px)]:sticky"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titre-carte" className="scroll-mt-28 font-display text-lg font-bold text-navy-900">
              Bruxelles-Capitale
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span
                className={`h-2 w-2 rounded-full ${direct.enDirect ? "bg-ok-600" : "bg-ink-faint"}`}
                aria-hidden="true"
              />
              {direct.enDirect ? `Règles à jour · ${heureBruxelles(direct.luLe)}` : "Repères de référence"}
            </p>
          </div>

          <div className="mt-3">
            <CarteBruxelles
              selection={commune.slug}
              onChoisir={choisir}
              noms={NOMS}
              modifiees={modifiees}
              aLInstant={aLInstant.communes}
              fermees={fermees}
            />
          </div>

          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] bg-navy-900" aria-hidden="true" /> Commune choisie
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] border border-gold-500 bg-gold-100" aria-hidden="true" /> Règle
              modifiée récemment
            </li>
          </ul>

          <label className="mt-4 block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Trouver une commune
            </span>
            <span className="relative mt-1.5 block">
              <IconeRecherche className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                list="liste-communes"
                value={recherche}
                onChange={(e) => chercher(e.target.value)}
                placeholder="Code postal ou nom (1050, Elsene…)"
                autoComplete="off"
                enterKeyHint="search"
                className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-navy-600"
              />
            </span>
            <datalist id="liste-communes">
              {COMMUNES.map((c) => (
                <option key={c.slug} value={c.nom}>
                  {`${c.codesPostaux.join(", ")} · ${c.nl}`}
                </option>
              ))}
            </datalist>
          </label>
          <a
            href="#fiche-commune"
            className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-navy-700 underline lg:hidden"
          >
            Lire la fiche de {commune.nom} ↓
          </a>
        </section>

        {/* La fiche */}
        <section
          id="fiche-commune"
          key={commune.slug}
          className="scroll-mt-24 animate-rise rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-700">
                {fiche.codesPostaux.join(" · ")}
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-navy-900">{fiche.nom}</h2>
              {fiche.nl !== fiche.nom && (
                <p className="text-sm text-ink-soft">
                  <span lang="nl">{fiche.nl}</span> en néerlandais
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aLInstant.communes.has(fiche.slug) && <Pastille ton="signal">Modifiée à l&apos;instant</Pastille>}
              {modifiees.has(fiche.slug) && !aLInstant.communes.has(fiche.slug) && (
                <Pastille ton="signal">Règle modifiée récemment</Pastille>
              )}
            </div>
          </div>

          {(misAJour || fiche.sourceUrl) && (
            <p className="mt-2 text-xs text-ink-soft">
              {fiche.sourceUrl && fiche.enVigueurDepuis && (
                <>Règlement en vigueur depuis le {dateLisible(fiche.enVigueurDepuis)} · </>
              )}
              {misAJour && <>Fiche {misAJour}</>}
            </p>
          )}

          {!fiche.ouverte && (
            <p className="mt-4 rounded-2xl border-l-4 border-azur-600 bg-azur-50 p-3.5 text-sm leading-relaxed text-ink">
              Les règles de cette commune sont en cours de vérification. En attendant, les repères
              ci-dessous sont généraux : vérifiez le règlement officiel.
            </p>
          )}

          {fiche.prochaine && (
            <p className="mt-4 rounded-2xl border-l-4 border-gold-400 bg-gold-50 p-3.5 text-sm leading-relaxed text-ink">
              <span className="font-bold text-navy-900">Nouveau règlement annoncé :</span> il entre en
              vigueur le {dateLisible(fiche.prochaine.enVigueurDepuis)}. Pour un constat fait avant
              cette date, ce sont les règles ci-dessous qui s&apos;appliquent.
            </p>
          )}

          {changementsCommune.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Ce qui a changé</h3>
              <ul className="mt-2 space-y-2">
                {changementsCommune.map((c) => (
                  <LigneChangement key={c.id} c={c} nouveau={aLInstant.changements.has(c.id)} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Repere label="Zones" valeur={fiche.zones} vientDeChanger={neuf("zones")} />
            <Repere label="Horaires de paiement" valeur={fiche.horaires} vientDeChanger={neuf("horaires")} />
            <Repere label="Périodes libres" valeur={fiche.gratuite} vientDeChanger={neuf("gratuite")} />
            <Repere label="Moyens de paiement" valeur={fiche.paiement} vientDeChanger={neuf("paiement")} />
            <div className="sm:col-span-2">
              <Repere label="Cartes de riverain" valeur={fiche.cartes} vientDeChanger={neuf("cartes")} />
            </div>
            {fiche.tarifs && (
              <div className="sm:col-span-2">
                <Repere label="Tarifs" valeur={fiche.tarifs} vientDeChanger={neuf("tarifs")} />
              </div>
            )}
            {fiche.contestation && (
              <div className="sm:col-span-2">
                <Repere label="Pour contester" valeur={fiche.contestation} vientDeChanger={neuf("contestation")} />
              </div>
            )}
          </div>

          <p
            className={`mt-4 rounded-2xl border-l-4 border-gold-400 p-3.5 text-sm leading-relaxed text-ink ${
              neuf("aSavoir") ? "bg-gold-100" : "bg-gold-50"
            }`}
          >
            <span className="font-bold text-navy-900">À retenir{neuf("aSavoir") ? " (modifié)" : ""} :</span>{" "}
            {fiche.aSavoir}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={fiche.parking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              {estPageGenerale
                ? `Règlement communal de ${fiche.nom} — parking.brussels`
                : `Tarifs et zones de ${fiche.nom} — parking.brussels`}
              <IconeLien className="h-3.5 w-3.5" />
            </a>
            {fiche.sourceUrl && (
              <a
                href={fiche.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-navy-900 transition hover:border-navy-200 hover:bg-navy-50"
              >
                Texte du règlement
                <IconeLien className="h-3.5 w-3.5" />
              </a>
            )}
            <a
              href={fiche.siteOfficiel}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-navy-900 transition hover:border-navy-200 hover:bg-navy-50"
            >
              Site officiel de la commune
              <IconeLien className="h-3.5 w-3.5" />
            </a>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Les horaires, tarifs et plages de gratuité exacts figurent dans le règlement communal en
            vigueur à la date de votre constat : vérifiez toujours la version officielle avant de
            contester.
          </p>
        </section>
      </div>

      {/* Le journal : tout ce qui a changé ces douze derniers mois. */}
      {recents.length > 0 && (
        <section aria-labelledby="titre-journal" className="mt-8">
          <h2 id="titre-journal" className="font-display text-xl font-bold text-navy-900">
            Les dernières modifications
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Ce qui a changé ces douze derniers mois, de la plus récente à la plus ancienne.
          </p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {recents.map((c) => (
              <LigneChangement
                key={c.id}
                c={c}
                nouveau={aLInstant.changements.has(c.id)}
                commune={
                  c.slug && NOMS[c.slug] ? (
                    <button
                      type="button"
                      onClick={() => {
                        choisir(c.slug as string);
                        document.getElementById("titre-carte")?.scrollIntoView({ block: "start" });
                      }}
                      className="rounded-full bg-navy-900 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-navy-800"
                    >
                      {NOMS[c.slug]}
                    </button>
                  ) : (
                    <Pastille ton="encre">Toute la Région</Pastille>
                  )
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

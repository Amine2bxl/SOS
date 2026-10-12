/**
 * La carte d'une formule d'adhésion, écrite une seule fois.
 *
 * Les formules apparaissent sur la page des tarifs, sur l'accueil et au moment
 * d'adhérer. Trois copies, c'était trois occasions de diverger — un prix mis à
 * jour ici mais pas là. `PLANS` (`lib/plans.ts`) reste la source des données,
 * ce composant est la source de leur présentation.
 *
 * La formule mise en avant passe à l'encre, avec le marquage jaune : on la
 * voit avant de lire.
 */

import { LinkBtn } from "@/components/ui";
import { formatPrix, type Plan } from "@/lib/plans";

export function CarteFormule({
  plan,
  /** `courte` n'affiche que les quatre premiers avantages : pour l'accueil. */
  courte = false,
  /** Masque le bouton là où la formule est déjà choisie. */
  sansAction = false,
  libelleAction,
  href,
}: {
  plan: Plan;
  courte?: boolean;
  sansAction?: boolean;
  libelleAction?: string;
  href?: string;
}) {
  const avantages = courte ? plan.avantages.slice(0, 4) : plan.avantages;
  const lien = href ?? (plan.id === "gratuit" ? "/connexion" : `/adherer?formule=${plan.id}`);
  const libelle =
    libelleAction ?? (plan.id === "gratuit" ? "Commencer gratuitement" : `Adhérer — ${plan.nom}`);
  const fonce = !!plan.miseEnAvant;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[var(--radius-carte)] p-6 shadow-carte ${
        fonce ? "bg-navy-900 text-white shadow-flotte" : "border border-line/80 bg-card"
      }`}
    >
      {fonce && <div className="motif-marquage absolute inset-x-0 top-0 h-1.5" aria-hidden="true" />}
      {fonce && (
        <p className="mb-3 inline-block self-start rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy-950">
          Le plus choisi
        </p>
      )}

      <h3 className={`font-display text-xl font-bold ${fonce ? "text-white" : "text-navy-900"}`}>{plan.nom}</h3>
      <p className={`mt-1 text-sm ${fonce ? "text-navy-100" : "text-ink-soft"}`}>{plan.pour}</p>

      <p className="mt-5 flex items-baseline gap-1">
        <span className={`font-display text-5xl font-extrabold ${fonce ? "text-white" : "text-navy-900"}`}>
          {formatPrix(plan.prixAnnuel)}
        </span>
        {plan.prixAnnuel > 0 && <span className={`text-sm ${fonce ? "text-navy-100" : "text-ink-soft"}`}>/ an</span>}
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {avantages.map((a) => (
          <li key={a} className={`flex gap-3 text-sm ${fonce ? "text-white" : "text-ink"}`}>
            {/* Un trait de marquage au sol, en guise de puce. */}
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
            {a}
          </li>
        ))}
      </ul>

      {!sansAction && (
        <LinkBtn href={lien} variant={fonce ? "gold" : "secondary"} className="mt-7 w-full">
          {libelle}
        </LinkBtn>
      )}
    </div>
  );
}

/**
 * La carte d'une formule d'adhésion, écrite une seule fois.
 *
 * Les formules apparaissent sur la page des tarifs, sur l'accueil et au moment
 * d'adhérer. Trois copies, c'était trois occasions de diverger — un prix mis à
 * jour ici mais pas là. `PLANS` (`lib/plans.ts`) reste la source des données,
 * ce composant est la source de leur présentation.
 */

import { LinkBtn, Check } from "@/components/ui";
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
  const lien =
    href ?? (plan.id === "gratuit" ? "/inscription" : `/adherer?formule=${plan.id}`);
  const libelle =
    libelleAction ??
    (plan.id === "gratuit" ? "Créer un compte gratuit" : `Adhérer — ${plan.nom}`);

  return (
    <div
      className={`flex flex-col rounded-xl bg-card p-6 shadow-sm ${
        plan.miseEnAvant ? "border-2 border-gold-400" : "border border-line"
      }`}
    >
      {plan.miseEnAvant && (
        <p className="mb-3 inline-block self-start rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy-950">
          Le plus choisi
        </p>
      )}

      <h3 className="font-display text-xl font-bold text-navy-900">{plan.nom}</h3>
      <p className="mt-1 text-sm text-ink-soft">{plan.pour}</p>

      <p className="mt-5">
        <span className="font-display text-4xl font-black text-navy-900">
          {formatPrix(plan.prixAnnuel)}
        </span>
        {plan.prixAnnuel > 0 && <span className="ml-1 text-sm text-ink-soft">/ an</span>}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {avantages.map((a) => (
          <li key={a} className="flex gap-2.5 text-sm text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            {a}
          </li>
        ))}
      </ul>

      {!sansAction && (
        <LinkBtn
          href={lien}
          variant={plan.miseEnAvant ? "gold" : "secondary"}
          className="mt-7 w-full"
        >
          {libelle}
        </LinkBtn>
      )}
    </div>
  );
}

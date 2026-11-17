import { Card } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { coordonneesBancaires } from "@/lib/paiement";
import { ASSO } from "@/lib/data";
import { CopierTexte } from "@/components/CopierTexte";
import { QrVirement } from "@/components/QrVirement";

/**
 * Ce qu'il faut faire pour payer son adhésion, une fois la demande posée.
 *
 * Deux détails méritent qu'on s'y arrête.
 *
 * La **communication structurée** est l'élément central de l'écran, et pas une
 * ligne de bas de page. C'est elle, et elle seule, qui relie le virement à la
 * personne : sans elle, l'association voit arriver 70 € d'un nom qui ne
 * correspond à aucun compte — parce que c'est le conjoint ou l'employeur qui a
 * payé — et l'accès reste bloqué pendant des jours. Le bouton de copie n'est
 * pas une coquetterie : une communication structurée mal recopiée est refusée
 * par la banque.
 *
 * L'**IBAN** vient d'une variable d'environnement. S'il n'est pas configuré, cet
 * écran le dit et propose de demander les coordonnées, au lieu d'afficher un
 * numéro approximatif. On ne fait pas virer de l'argent sur un compte dont on
 * n'est pas certain.
 */
export function InstructionsVirement({
  communication,
  montant,
  nomFormule,
}: {
  communication: string;
  montant: number;
  nomFormule: string;
}) {
  const banque = coordonneesBancaires();

  return (
    <Card className="mt-6 border-2 border-gold-400">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-700">
        Demande enregistrée
      </p>
      <h2 className="mt-1 font-display text-xl font-bold text-navy-900">
        Dernière étape : le virement
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        Adhésion {nomFormule} réservée. Active dès réception du virement : 1 à 2 jours ouvrables.
      </p>

      <dl className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2 p-4">
          <dt className="text-sm text-ink-soft">Montant</dt>
          <dd className="font-display text-lg font-bold text-navy-900">
            {montant.toFixed(2).replace(".", ",")} €
          </dd>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 p-4">
          <dt className="text-sm text-ink-soft">Bénéficiaire</dt>
          <dd className="text-sm font-semibold text-navy-900">{ASSO.nom}</dd>
        </div>

        {banque ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 p-4">
              <dt className="text-sm text-ink-soft">Compte (IBAN)</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-navy-900">{banque.iban}</span>
                <CopierTexte valeur={banque.iban} libelle="Copier l'IBAN" />
              </dd>
            </div>
            {banque.bic && (
              <div className="flex flex-wrap items-baseline justify-between gap-2 p-4">
                <dt className="text-sm text-ink-soft">BIC</dt>
                <dd className="font-mono text-sm text-navy-900">{banque.bic}</dd>
              </div>
            )}
          </>
        ) : (
          <div className="p-4">
            <dt className="text-sm text-ink-soft">Compte (IBAN)</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink">
              Coordonnées bancaires pas encore affichées.{" "}
              <BoutonContact variante="lien">Demandez-les-nous</BoutonContact> avec la référence ci-dessous. Réponse le jour même.
            </dd>
          </div>
        )}
      </dl>

      {banque && (
        <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-line bg-paper p-4 sm:flex-row">
          <QrVirement
            virement={{ iban: banque.iban, bic: banque.bic, beneficiaire: banque.beneficiaire, montant, communication }}
            taille={140}
            className="shrink-0 border border-line p-1"
          />
          <p className="text-sm leading-relaxed text-ink">
            <strong className="text-navy-900">Le plus simple :</strong> scannez ce QR code avec l&apos;appli de votre banque. Tout est prérempli.
          </p>
        </div>
      )}

      {/* La communication structurée est mise en avant : c'est le seul champ
          du virement que l'association ne peut pas deviner. */}
      <div className="mt-5 rounded-2xl border-l-4 border-navy-900 bg-navy-50 p-4">
        <p className="text-sm font-bold text-navy-900">
          Communication structurée, à recopier telle quelle
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="select-all font-mono text-base font-bold tracking-wide text-navy-900">
            {communication}
          </code>
          <CopierTexte valeur={communication} libelle="Copier la référence" />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          Collez-la dans le champ « communication structurée ». Sans elle, l&apos;activation prend plusieurs jours.
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Aucune donnée bancaire demandée ici. Reçu envoyé dès le paiement enregistré.
      </p>
    </Card>
  );
}

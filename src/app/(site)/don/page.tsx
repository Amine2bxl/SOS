import type { Metadata } from "next";
import { ASSO } from "@/lib/data";
import { coordonneesBancaires } from "@/lib/paiement";
import { CopierTexte } from "@/components/CopierTexte";
import { BoutonContact } from "@/components/Contact";
import { LinkBtn } from "@/components/ui";
import { IconeFleche } from "@/components/icones";

export const metadata: Metadata = {
  title: "Faire un don",
  description:
    "Soutenez SOS Citizens par virement : votre don finance l'outil d'analyse, l'accompagnement des dossiers et le travail d'information de l'association.",
};

const COMMUNICATION_DON = "Don SOS Citizens";

/** Ce que l'argent finance, sans chiffre inventé. */
const USAGES = [
  {
    titre: "L'outil, gratuit pour tous",
    texte: "L'analyse sans compte, la lecture du courrier, les lettres en français et en néerlandais.",
  },
  {
    titre: "L'accompagnement des dossiers",
    texte: "Les réponses écrites, la relecture des cas difficiles, les demandes de preuves aux administrations.",
  },
  {
    titre: "L'information",
    texte: "Les fiches des 19 communes, tenues à jour, et l'alerte quand une règle change.",
  },
];

export default function DonPage() {
  const banque = coordonneesBancaires();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
        <div>
          <h1 className="font-display text-[2.2rem] font-extrabold leading-[1.06] text-navy-900 text-balance sm:text-[3rem]">
            Chaque don aide quelqu&apos;un à répondre à son courrier.
          </h1>
          <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
            Chaque jour, des citoyens reçoivent des courriers qu&apos;ils ne comprennent pas, des frais qui
            s&apos;empilent, des décisions sans explication. {ASSO.nom} se tient à leurs côtés, sans but lucratif. Elle
            vit des adhésions de ses membres et de vos dons.
          </p>

          <ul className="mt-10 space-y-6">
            {USAGES.map((u) => (
              <li key={u.titre} className="border-t-2 border-navy-900 pt-3">
                <h2 className="font-display text-lg font-bold text-navy-900">{u.titre}</h2>
                <p className="mt-1 max-w-xl leading-relaxed text-ink-soft">{u.texte}</p>
              </li>
            ))}
          </ul>

          <section className="mt-12 max-w-xl">
            <h2 className="font-display text-xl font-bold text-navy-900">Don, adhésion : la différence</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Un don soutient l&apos;association, sans contrepartie : il ne fait pas de vous un membre et ne donne pas
              accès à un service. L&apos;adhésion, elle, ouvre les dossiers illimités et la relecture par
              l&apos;association. Aucune attestation fiscale n&apos;est délivrée à ce jour.
            </p>
            <div className="mt-5">
              <LinkBtn href="/tarifs" variant="secondary">
                Voir l&apos;adhésion
                <IconeFleche className="h-4 w-4" />
              </LinkBtn>
            </div>
          </section>
        </div>

        {/* Le bloc de virement suit la page au défilement sur grand écran :
            c'est lui qu'on vient chercher. */}
        <aside className="rounded-[var(--radius-carte)] bg-navy-900 p-6 text-white shadow-flotte sm:p-7 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl font-extrabold">Par virement</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-navy-100">
            Depuis votre banque, du montant de votre choix. Aucune donnée bancaire ne vous est demandée ici.
          </p>

          <dl className="mt-6 divide-y divide-white/10 rounded-2xl bg-white/[0.06]">
            <div className="p-4">
              <dt className="text-xs text-navy-100">Bénéficiaire</dt>
              <dd className="mt-0.5 font-semibold">{banque?.beneficiaire ?? ASSO.nom}</dd>
            </div>
            <div className="p-4">
              <dt className="text-xs text-navy-100">IBAN</dt>
              {banque ? (
                <dd className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[1.05rem] font-semibold tracking-wide">{banque.iban}</span>
                  <CopierTexte valeur={banque.iban.replace(/\s/g, "")} libelle="Copier l'IBAN" />
                </dd>
              ) : (
                <dd className="mt-1 text-sm leading-relaxed text-navy-100">
                  Les coordonnées du compte ne sont pas encore publiées ici.{" "}
                  <BoutonContact variante="lien" className="text-gold-300! decoration-gold-300/40! hover:text-white!">
                    Demandez-les-nous
                  </BoutonContact>
                  : nous répondons le jour même.
                </dd>
              )}
            </div>
            {banque?.bic && (
              <div className="p-4">
                <dt className="text-xs text-navy-100">BIC</dt>
                <dd className="mt-0.5 font-mono">{banque.bic}</dd>
              </div>
            )}
            <div className="p-4">
              <dt className="text-xs text-navy-100">Communication</dt>
              <dd className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{COMMUNICATION_DON}</span>
                <CopierTexte valeur={COMMUNICATION_DON} libelle="Copier la communication" />
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-sm leading-relaxed text-navy-100">
            Merci : c&apos;est grâce à vous que l&apos;analyse reste gratuite.
          </p>
        </aside>
      </div>
    </div>
  );
}

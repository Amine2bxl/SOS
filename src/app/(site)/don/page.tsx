import type { Metadata } from "next";
import { ASSO } from "@/lib/data";
import { coordonneesBancaires, lienDonCarte } from "@/lib/paiement";
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
    texte: "La vérification sans compte et les lettres en français et en néerlandais.",
  },
  {
    titre: "L'accompagnement des dossiers",
    texte: "Les réponses des bénévoles et les demandes de preuves aux administrations.",
  },
  {
    titre: "L'information",
    texte: "Les règles des 19 communes, tenues à jour.",
  },
];

export default function DonPage() {
  const banque = coordonneesBancaires();
  const carte = lienDonCarte();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
        <div>
          <h1 className="font-display text-[2.2rem] font-extrabold leading-[1.06] text-navy-900 text-balance sm:text-[3rem]">
            Chaque don aide quelqu&apos;un à répondre à son courrier.
          </h1>
          <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
            {ASSO.nom} vit des adhésions et des dons. Votre don garde la vérification gratuite pour tous.
          </p>
          {/* Sur téléphone, le bloc pour donner tombe sous le texte : un raccourci y mène. */}
          <div className="mt-6 lg:hidden">
            <LinkBtn href="#donner" variant="gold">
              Faire un don maintenant
              <IconeFleche className="h-4 w-4 rotate-90" />
            </LinkBtn>
          </div>

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
              Le don : un soutien, sans contrepartie. L&apos;adhésion : 70 € par an, dossiers illimités et relecture.
              Pas d&apos;attestation fiscale pour l&apos;instant.
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
        <aside id="donner" className="scroll-mt-20 rounded-[var(--radius-carte)] bg-navy-900 p-6 text-white shadow-flotte sm:p-7 lg:sticky lg:top-24">
          {carte && (
            <div className="mb-7 border-b border-white/10 pb-7">
              <h2 className="font-display text-2xl font-extrabold">Par carte</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-100">Bancontact, carte bancaire ou Apple Pay. Paiement sécurisé par Stripe.</p>
              <a
                href={carte}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-gold-400 text-base font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300 active:scale-[0.97]"
              >
                Donner par carte
                <IconeFleche className="h-5 w-5" />
              </a>
            </div>
          )}
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

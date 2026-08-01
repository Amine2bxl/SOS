import { PageHead, SectionCard, LinkBtn } from "@/components/ui";
import { HeartIcon } from "@/components/Logo";

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="L'association"
        title="À propos de SOS Citizens ASBL"
        intro="SOS Citizens ASBL ne vous aide pas seulement à rédiger un courrier : la plateforme vous apprend à lire votre dossier, à comprendre la procédure, à identifier les preuves et à agir de manière documentée."
      />

      <div className="mt-10 space-y-6">
        <SectionCard title="Notre mission">
          <p className="text-sm leading-relaxed text-ink-soft">
            SOS Citizens ASBL est une association sans but lucratif qui défend un accès équitable à
            l'information face aux administrations et aux pratiques abusives. La plateforme citoyenne permet à
            chaque usager du stationnement en Région de Bruxelles-Capitale de comprendre la nature exacte du
            document reçu, la commune compétente, le stade de la procédure, les délais applicables, les preuves
            disponibles, les pièces manquantes et les conséquences d'un paiement ou d'une contestation.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Présidence : <span className="font-semibold text-navy-900">Mohamed Azouzi</span>, Président.
          </p>
        </SectionCard>

        <SectionCard title="Ce que nous faisons">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              "Analyse pédagogique des dossiers de stationnement",
              "Veille réglementaire sur les 19 communes",
              "Rédaction de guides et de modèles de courriers",
              "Accompagnement des affiliés dans le suivi des réponses",
              "Information sur les droits liés aux données personnelles",
              "Orientation, sans jamais promettre une annulation",
            ].map((x) => (
              <li key={x} className="flex gap-2 rounded-md bg-paper p-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />{x}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Nos coordonnées">
          <p className="text-sm text-ink-soft">Président : Mohamed Azouzi</p>
          <p className="text-sm text-ink-soft">Téléphone : [numéro officiel à confirmer]</p>
          <p className="text-sm text-ink-soft">E-mail : [adresse officielle à confirmer]</p>
          <p className="text-sm text-ink-soft">Adresse : [siège ou adresse de correspondance à confirmer]</p>
          <p className="mt-3 text-xs text-ink-soft">
            Aucune coordonnée non confirmée n'est publiée, afin d'éviter toute erreur publique.
          </p>
        </SectionCard>

        <div id="confidentialite">
          <SectionCard title="Politique de confidentialité">
            <p className="text-sm leading-relaxed text-ink-soft">
              Les informations saisies sur la plateforme servent exclusivement à préparer et suivre votre
              dossier. Elles ne sont ni vendues, ni transmises à des tiers à des fins commerciales. Les
              documents déposés restent sous votre contrôle.
            </p>
          </SectionCard>
        </div>
        <div id="donnees">
          <SectionCard title="Gestion des données">
            <p className="text-sm leading-relaxed text-ink-soft">
              Vous pouvez exercer vos droits d'accès, de rectification et de suppression à tout moment via la
              page Contact (objet « Suppression de mes données »). Les données d'analyse sont conservées
              uniquement le temps nécessaire à l'accompagnement, puis supprimées sur demande.
            </p>
          </SectionCard>
        </div>
        <div id="conditions">
          <SectionCard title="Conditions d'accès">
            <p className="text-sm leading-relaxed text-ink-soft">
              La plateforme est un outil citoyen d'information, de préparation documentaire et d'orientation.
              Elle ne fournit pas de conseil juridique personnalisé et ne garantit aucune issue de procédure.
              Chaque dossier reste soumis à l'examen des faits, des pièces et du droit applicable.
            </p>
          </SectionCard>
        </div>

        <div className="flex justify-center gap-3">
          <LinkBtn href="/don" variant="gold"><HeartIcon className="h-4 w-4 animate-heartbeat" /> Soutenir l'association</LinkBtn>
          <LinkBtn href="/contact" variant="secondary">Nous contacter</LinkBtn>
        </div>
      </div>
    </div>
  );
}

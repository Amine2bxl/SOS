import { PageHead, SectionCard, EduBox, LinkBtn } from "@/components/ui";

const DOC_TYPES = [
  {
    t: "Notification initiale",
    d: "Premier courrier réclamant une redevance après un constat (ScanCar, agent, caméra). Elle indique la référence, le lieu, la date, le montant et les voies de recours. C'est le point de départ des délais de contestation.",
  },
  {
    t: "Rappel (premier / deuxième)",
    d: "Courrier envoyé en l'absence de paiement ou de réponse. Il majore parfois le montant. Un rappel émis pendant l'examen d'une contestation doit être examiné avec attention.",
  },
  {
    t: "Mise en demeure préalable",
    d: "Acte formel exigeant le paiement dans un délai déterminé avant le recouvrement forcé. Ne jamais l'ignorer : c'est le dernier stade amiable.",
  },
  {
    t: "Contrainte / titre exécutoire",
    d: "Acte qui rend la créance exécutoire. Des recours spécifiques existent, avec des délais courts. Vérifiez la signification et le fondement.",
  },
  {
    t: "Courrier d'huissier / mesure d'exécution",
    d: "Intervention d'un huissier de justice (saisie, citation). À ce stade, un accompagnement individualisé et, le cas échéant, un conseil juridique sont recommandés.",
  },
];

const REGLES = [
  ["La zone payante", "Chaque commune découpe son territoire en zones (verte, rouge, bleue…) avec des tarifs, horaires et durées propres. Le régime applicable est celui de la zone exacte du constat, à la date des faits."],
  ["La ScanCar", "Véhicule équipé de caméras lisant les plaques et les comparant aux paiements et autorisations enregistrés. Un horodatage et une géolocalisation sont associés à chaque contrôle."],
  ["Le contrôle de plaque", "La plaque lue est confrontée à la base des sessions de paiement et des cartes. Une erreur de lecture, de plaque ou de zone peut produire un constat erroné : d'où l'importance des photographies et métadonnées."],
  ["L'absence de titre", "L'absence de paiement ou de carte valable au moment du contrôle fonde la redevance. Mais une session active, une carte valable ou un horodateur hors service peuvent renverser la présomption, à condition d'être prouvés."],
  ["L'arrêt vs le stationnement", "L'immobilisation momentanée pour embarquement, débarquement ou chargement peut, selon les règlements, ne pas constituer un stationnement. La preuve de la situation (durée, présence au volant) est déterminante."],
  ["Les données personnelles", "Les photographies et journaux de contrôle sont des données personnelles. Vous pouvez en demander l'accès au titre du RGPD, indépendamment de la contestation."],
];

export default function ComprendrePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Pédagogie"
        title="Comprendre le stationnement avant d'agir"
        intro="La plateforme ne se contente pas de générer un courrier : elle vous apprend à lire votre dossier, à comprendre la procédure et à identifier les preuves utiles."
      />

      <div className="mt-10 space-y-6">
        <SectionCard title="Les documents de la procédure, du plus doux au plus sévère">
          <ol className="space-y-4">
            {DOC_TYPES.map((x, i) => (
              <li key={x.t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold-300">{i + 1}</span>
                <div>
                  <p className="font-bold text-navy-900">{x.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{x.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <EduBox title="Payer ou contester ?">
          Le paiement d'une redevance peut être interprété comme une reconnaissance des faits et clôturer le
          dossier. Si vous entendez contester, agissez dans les délais, par écrit, avec preuve d'envoi, et
          demandez la suspension du recouvrement pendant l'examen.
        </EduBox>

        <SectionCard title="Les mécanismes à comprendre">
          <div className="grid gap-4 sm:grid-cols-2">
            {REGLES.map(([t, d]) => (
              <div key={t} className="rounded-lg border border-line bg-white p-4">
                <p className="font-display font-bold text-navy-900">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Les preuves qui font la différence">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              "Reçu de paiement horodaté mentionnant plaque et zone",
              "Capture d'application montrant la session active",
              "Relevé bancaire concordant",
              "Photographies du lieu, de la signalisation et du véhicule",
              "Copie de la carte riverain, professionnelle ou PMR",
              "Preuve d'enregistrement de plaque",
              "Accusés de réception et copies des courriers envoyés",
              "Document de vente, contrat de location ou plainte selon le cas",
            ].map((p) => (
              <li key={p} className="flex gap-2 rounded-md bg-paper p-2.5">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" fill="currentColor"><path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 7.7-5.4 6a1 1 0 0 1-1.5 0l-2.5-2.8a1 1 0 1 1 1.5-1.3l1.7 2 4.7-5.2a1 1 0 0 1 1.5 1.3Z"/></svg>
                {p}
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="flex justify-center gap-3">
          <LinkBtn href="/analyser" variant="gold">Analyser mon dossier</LinkBtn>
          <LinkBtn href="/communes" variant="secondary">Les règles de ma commune</LinkBtn>
        </div>
      </div>
    </div>
  );
}

import { PageHead, SectionCard, LinkBtn } from "@/components/ui";

const GUIDES = [
  {
    t: "Modèle — Contestation initiale avec demande de pièces",
    d: "Structure type : identification, faits chronologiques, motif soutenu par pièces, demandes (communication du dossier, photographies, métadonnées, motivation), suspension du recouvrement, gel des frais, absence de reconnaissance de dette, réserve de tous droits.",
    code: `Objet : Contestation de la redevance n° [référence] – constat du [date]

Madame, Monsieur,

Je conteste la redevance référencée ci-dessus pour le motif suivant : [motif].
[Faits chronologiques : heures, lieu, actions, documents.]

Je demande :
- la communication de l'ensemble des photographies et métadonnées ;
- le rapport de constat et le journal du contrôle ;
- le règlement applicable à la date du constat ;
- la motivation individualisée de la décision.

Je sollicite la suspension du recouvrement et le gel des frais pendant l'examen.
La présente ne vaut pas reconnaissance de dette ; tous droits réservés.

[Signature]`,
  },
  {
    t: "Modèle — Demande d'accès aux données personnelles (RGPD)",
    d: "Démarche distincte de la contestation : elle vise les photographies, l'origine des données, les destinataires, la durée de conservation et la base du traitement.",
    code: `Objet : Droit d'accès – données personnelles (RGPD, art. 15)

Madame, Monsieur,

Je vous prie de me communiquer :
- les catégories de données traitées me concernant ;
- les photographies associées au dossier [référence] ;
- l'origine des données et leurs destinataires ;
- la durée de conservation et la base juridique du traitement ;
- l'existence d'une décision automatisée et sa logique.

[Signature]`,
  },
  {
    t: "Modèle — Relance après absence de réponse",
    d: "À utiliser lorsqu'un accusé de réception existe mais aucune réponse sur le fond n'a été communiquée dans un délai raisonnable.",
    code: `Objet : Relance – contestation du [date], réf. [référence]

Madame, Monsieur,

Ma contestation du [date] est restée sans réponse sur le fond.
Je vous prie de me communiquer une décision motivée et, à défaut,
de m'indiquer les voies et délais de recours applicables.

Tous droits réservés. [Signature]`,
  },
  {
    t: "Guide — Préparer ses preuves",
    d: "Checklist : reçu horodaté avec plaque et zone ; capture d'application ; relevé bancaire ; photos du lieu et de la signalisation ; carte ou autorisation ; accusés de réception ; tout échange avec l'administration. Chaque pièce doit être datée et concordante.",
    code: null,
  },
  {
    t: "Guide — Conserver une preuve d'envoi",
    d: "Privilégiez les canaux laissant une trace : formulaire avec accusé, e-mail avec confirmation, courrier recommandé. Conservez la référence, la date et une copie complète du dossier envoyé.",
    code: null,
  },
];

export default function ModelesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Boîte à outils"
        title="Modèles et guides"
        intro="Des modèles de courriers et des guides pratiques pour préparer une démarche claire, documentée et adaptée. Chaque modèle doit être adapté aux faits et pièces de votre dossier."
      />
      <div className="mt-10 space-y-5">
        {GUIDES.map((g) => (
          <SectionCard key={g.t} title={g.t}>
            <p className="text-sm leading-relaxed text-ink-soft">{g.d}</p>
            {g.code && (
              <pre className="mt-4 overflow-auto rounded-lg border border-line bg-navy-950 p-4 text-xs leading-relaxed text-navy-100">{g.code}</pre>
            )}
          </SectionCard>
        ))}
        <div className="text-center">
          <LinkBtn href="/analyser" variant="gold">Générer un courrier personnalisé</LinkBtn>
        </div>
      </div>
    </div>
  );
}

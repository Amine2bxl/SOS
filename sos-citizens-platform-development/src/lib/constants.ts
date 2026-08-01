export type Option = { value: string; label: string; hint?: string };

export const NATURES: Option[] = [
  { value: "redevance", label: "Redevance de stationnement", hint: "Zone payante, zone bleue, scan-car…" },
  { value: "sac", label: "Sanction administrative communale (SAC)", hint: "Courrier d'un fonctionnaire sanctionnateur" },
  { value: "pv", label: "PV / Amende routière", hint: "Police, parquet, perception immédiate…" },
  { value: "prive", label: "Parking privé", hint: "Litige contractuel avec un exploitant privé" },
  { value: "nspp", label: "Je ne sais pas", hint: "Déposez une photo, la plateforme vous aide à identifier la nature" },
];

export const DOCUMENTS: Option[] = [
  { value: "notification_initiale", label: "Notification initiale" },
  { value: "premier_rappel", label: "Premier rappel" },
  { value: "deuxieme_rappel", label: "Deuxième rappel" },
  { value: "mise_en_demeure", label: "Mise en demeure préalable" },
  { value: "contrainte", label: "Contrainte ou titre exécutoire" },
  { value: "courrier_huissier", label: "Courrier d'un huissier" },
  { value: "mesure_execution", label: "Mesure d'exécution" },
  { value: "decision_rejet", label: "Décision rejetant une contestation" },
  { value: "accuse_sans_reponse", label: "Accusé de réception sans réponse sur le fond" },
  { value: "autre", label: "Autre document" },
];

export const DESTINATAIRES: Option[] = [
  { value: "personne_physique", label: "Personne physique" },
  { value: "societe", label: "Société" },
  { value: "employeur", label: "Employeur" },
  { value: "proprietaire", label: "Propriétaire du véhicule" },
  { value: "locataire", label: "Locataire" },
  { value: "autre", label: "Autre" },
];

export const CONDUCTEURS: Option[] = [
  { value: "destinataire", label: "Le destinataire du courrier" },
  { value: "salarie", label: "Un salarié" },
  { value: "proche", label: "Un proche" },
  { value: "autre_personne", label: "Une autre personne" },
  { value: "inconnu", label: "Conducteur inconnu" },
];

export const MODES_CONTROLE: Option[] = [
  { value: "scancar", label: "ScanCar" },
  { value: "agent_pied", label: "Agent à pied" },
  { value: "camera", label: "Caméra" },
  { value: "inconnu", label: "Inconnu" },
];

export const MODES_RECEPTION: Option[] = [
  { value: "courrier", label: "Courrier postal" },
  { value: "ebox", label: "eBox" },
  { value: "email", label: "E-mail" },
  { value: "remise_directe", label: "Remise directe" },
  { value: "inconnu", label: "Inconnu" },
];

export const CANAUX_CONTESTATION: Option[] = [
  { value: "formulaire", label: "Formulaire" },
  { value: "email", label: "E-mail" },
  { value: "courrier", label: "Courrier postal" },
  { value: "portail", label: "Portail" },
  { value: "autre", label: "Autre" },
];

export const MOTIFS: Option[] = [
  { value: "paiement_effectue", label: "Paiement effectué" },
  { value: "session_active", label: "Session d'application active" },
  { value: "app_defaillante", label: "Application défaillante" },
  { value: "horodateur_hs", label: "Horodateur hors service" },
  { value: "erreur_plaque", label: "Erreur de plaque" },
  { value: "carte_riverain", label: "Carte riverain" },
  { value: "carte_pro", label: "Carte professionnelle" },
  { value: "carte_pmr", label: "Carte PMR" },
  { value: "vehicule_remplacement", label: "Véhicule de remplacement" },
  { value: "arret", label: "Arrêt et non stationnement" },
  { value: "embarquement", label: "Embarquement ou débarquement" },
  { value: "chargement", label: "Chargement ou déchargement" },
  { value: "signalisation_absente", label: "Signalisation absente ou ambiguë" },
  { value: "erreur_commune", label: "Erreur de commune ou de lieu" },
  { value: "vehicule_vendu", label: "Véhicule vendu, loué ou prêté" },
  { value: "plaque_usurpee", label: "Plaque volée ou usurpée" },
  { value: "notification_contestee", label: "Notification ou rappel contesté" },
  { value: "frais_contestes", label: "Frais contestés" },
  { value: "contestation_ignoree", label: "Contestation ignorée" },
  { value: "autre", label: "Autre situation" },
];

export const MOTIF_QUESTIONS: Record<string, string[]> = {
  paiement_effectue: [
    "À quelle heure le paiement a-t-il été activé ?",
    "Quelle plaque a été encodée ?",
    "Quelle commune ou zone a été sélectionnée ?",
    "Quel moyen de paiement a été employé ?",
    "Disposez-vous d'un reçu ?",
  ],
  session_active: [
    "Quelle application était utilisée ?",
    "Quelle était la plage horaire de la session ?",
    "La plaque encodée correspond-elle au véhicule ?",
    "Disposez-vous d'une capture datée ?",
  ],
  app_defaillante: [
    "Quel message d'erreur est apparu ?",
    "Avez-vous tenté un autre moyen de paiement ?",
    "Disposez-vous de captures horodatées de la défaillance ?",
  ],
  horodateur_hs: [
    "Quel était le numéro de l'horodateur ?",
    "Le panneau indiquait-il une alternative ?",
    "Avez-vous une photo de l'horodateur ?",
  ],
  erreur_plaque: [
    "Quelle plaque a été encodée dans l'application ?",
    "Quelle figure sur le procès-verbal de constat ?",
    "Disposez-vous du reçu avec la plaque correcte ?",
  ],
  carte_riverain: [
    "La carte était-elle valable à la date du constat ?",
    "Le véhicule était-il repris sur la carte ?",
    "La commune du constat correspond-elle à la carte ?",
  ],
  carte_pmr: [
    "La carte était-elle valable à la date du constat ?",
    "Était-elle apposée dans le véhicule ?",
    "La plaque était-elle enregistrée ?",
    "S'agissait-il du véhicule habituel ?",
    "Disposez-vous de photographies ou d'une preuve d'enregistrement ?",
  ],
  arret: [
    "Étiez-vous dans le véhicule ?",
    "Une personne montait-elle ou descendait-elle ?",
    "Une opération de chargement était-elle en cours ?",
    "Quelle était la durée approximative de l'immobilisation ?",
    "Disposez-vous d'une preuve datée ?",
  ],
  embarquement: [
    "Qui embarquait ou débarquait ?",
    "Combien de temps l'arrêt a-t-il duré ?",
    "Disposez-vous d'un témoin ou d'une preuve datée ?",
  ],
  chargement: [
    "Quelle marchandise était chargée ou déchargée ?",
    "Le véhicule était-il un véhicule utilitaire ?",
    "Disposez-vous d'un bon de livraison ou d'une preuve datée ?",
  ],
  signalisation_absente: [
    "Quels panneaux étaient présents ou absents ?",
    "Avez-vous des photographies de la signalisation ?",
    "Le marquage au sol était-il lisible ?",
  ],
  vehicule_vendu: [
    "À quelle date le véhicule a-t-il été cédé ?",
    "La vente a-t-elle été déclarée (DIV) ?",
    "Disposez-vous du document de vente ?",
  ],
  plaque_usurpee: [
    "Une plainte a-t-elle été déposée ?",
    "Le véhicule constaté correspond-il au vôtre (marque, couleur) ?",
    "Disposez-vous de la preuve de la plainte ?",
  ],
};

export const PIECES: Option[] = [
  { value: "notification", label: "Notification" },
  { value: "premier_rappel", label: "Premier rappel" },
  { value: "deuxieme_rappel", label: "Deuxième rappel" },
  { value: "mise_en_demeure", label: "Mise en demeure" },
  { value: "courrier_huissier", label: "Courrier d'huissier" },
  { value: "preuve_paiement", label: "Preuve de paiement" },
  { value: "releve_bancaire", label: "Relevé bancaire" },
  { value: "capture_application", label: "Capture d'application" },
  { value: "photos_lieu", label: "Photographies du lieu" },
  { value: "carte_autorisation", label: "Carte ou autorisation" },
  { value: "document_pro", label: "Document professionnel" },
  { value: "preuve_changement_plaque", label: "Preuve de changement de plaque" },
  { value: "emails", label: "Courriels échangés" },
  { value: "accuse_reception", label: "Accusé de réception" },
  { value: "decision_rejet", label: "Décision de rejet" },
  { value: "autre_piece", label: "Autre pièce" },
];

export const INVENTAIRE_KEYS: Option[] = [
  { value: "notification", label: "Notification" },
  { value: "premier_rappel", label: "Premier rappel" },
  { value: "deuxieme_rappel", label: "Deuxième rappel" },
  { value: "mise_en_demeure", label: "Mise en demeure" },
  { value: "contrainte", label: "Contrainte" },
  { value: "huissier", label: "Huissier" },
  { value: "contestation", label: "Contestation" },
  { value: "reponse", label: "Réponse" },
];

export const TECHNIQUES: Option[] = [
  { value: "photos_originales", label: "Photographies originales" },
  { value: "cliches_non_recadres", label: "Clichés non recadrés" },
  { value: "metadonnees", label: "Métadonnées disponibles" },
  { value: "horodatages", label: "Horodatages" },
  { value: "geolocalisation", label: "Coordonnées de localisation disponibles" },
  { value: "donnees_scancar", label: "Données ScanCar ou ANPR pertinentes" },
  { value: "rapport_constat", label: "Rapport de constat" },
  { value: "journal_technique", label: "Journal technique du contrôle" },
  { value: "identification_plaque", label: "Éléments ayant permis l'identification de la plaque" },
];

export const ADMINISTRATIVES: Option[] = [
  { value: "notification_initiale", label: "Notification initiale" },
  { value: "historique_dossier", label: "Historique du dossier" },
  { value: "dates_emission", label: "Dates d'émission et d'envoi" },
  { value: "preuve_expedition", label: "Preuve d'expédition lorsque pertinente" },
  { value: "rappels", label: "Rappels" },
  { value: "mise_en_demeure", label: "Mise en demeure" },
  { value: "decision_rejet", label: "Décision de rejet" },
  { value: "motivation", label: "Motivation individualisée" },
  { value: "identite_autorite", label: "Identité ou qualité de l'autorité décisionnaire" },
  { value: "delegation", label: "Délégation de compétence lorsque pertinente" },
];

export const JURIDIQUES: Option[] = [
  { value: "reglement_date_constat", label: "Règlement applicable à la date du constat" },
  { value: "deliberation_tarifaire", label: "Délibération tarifaire pertinente" },
  { value: "qualification_zone", label: "Qualification de la zone" },
  { value: "fondement_frais", label: "Fondement des frais" },
  { value: "fondement_majorations", label: "Fondement des majorations" },
  { value: "voies_recours", label: "Voies et délais de recours" },
];

export const DONNEES_PERSO: Option[] = [
  { value: "categories", label: "Catégories de données traitées" },
  { value: "origine", label: "Origine des données" },
  { value: "photos_dossier", label: "Photographies associées au dossier" },
  { value: "destinataires", label: "Destinataires" },
  { value: "duree_conservation", label: "Durée de conservation" },
  { value: "base_traitement", label: "Base du traitement" },
  { value: "validation_humaine", label: "Validation humaine ou traitement automatisé" },
];

export const DEMANDES: Option[] = [
  { value: "annulation", label: "Demande d'annulation" },
  { value: "reexamen", label: "Demande de réexamen" },
  { value: "communication_dossier", label: "Demande de communication du dossier" },
  { value: "photos", label: "Demande de photographies" },
  { value: "explication_delais", label: "Demande d'explication des délais" },
  { value: "motivation", label: "Demande de motivation individualisée" },
  { value: "suspension", label: "Demande de suspension du recouvrement" },
  { value: "gel_frais", label: "Demande de gel des frais" },
  { value: "non_transmission", label: "Demande de non-transmission à l'huissier" },
  { value: "non_reconnaissance", label: "Absence de reconnaissance de dette" },
  { value: "reserve_droits", label: "Réserve de tous droits" },
];

export const TYPES_COURRIER: Option[] = [
  { value: "contestation_initiale", label: "Contestation initiale" },
  { value: "communication_pieces", label: "Demande de communication des pièces" },
  { value: "relance", label: "Relance après absence de réponse" },
  { value: "reponse_rejet", label: "Réponse à un rejet" },
  { value: "reponse_huissier", label: "Réponse à un huissier" },
  { value: "plainte_mediateur", label: "Plainte auprès du médiateur" },
  { value: "donnees_personnelles", label: "Demande relative aux données personnelles" },
];

export const SUIVI_TEMPLATE: { key: string; label: string; hint: string }[] = [
  { key: "courrier_genere", label: "Courrier généré", hint: "Votre courrier est prêt à être envoyé." },
  { key: "courrier_envoye", label: "Courrier envoyé", hint: "Enregistrez la date d'envoi." },
  { key: "accuse_reception", label: "Accusé de réception", hint: "Ajoutez l'accusé de réception." },
  { key: "pieces_recues", label: "Pièces reçues", hint: "Documents communiqués par l'administration." },
  { key: "reponse_recue", label: "Réponse reçue", hint: "Enregistrez la réponse reçue." },
  { key: "reponse_analysee", label: "Réponse analysée", hint: "Comparez la réponse à vos demandes." },
  { key: "relance", label: "Relance préparée", hint: "Préparez une relance si nécessaire." },
  { key: "mediation", label: "Médiation envisagée", hint: "Plainte auprès du médiateur compétent." },
  { key: "recours", label: "Recours judiciaire à examiner", hint: "Évaluez les voies de recours restantes." },
];

export const labelOf = (opts: Option[], value?: string | null) =>
  opts.find((o) => o.value === value)?.label ?? value ?? "—";

export const formatMontant = (v?: string | null) => {
  if (!v) return "—";
  const n = parseFloat(v.replace(",", "."));
  if (Number.isNaN(n)) return v;
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
};

export const formatDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("fr-BE");
};

/**
 * Un rappel dans l'agenda du téléphone, sans compte ni service extérieur.
 *
 * Le format iCalendar (.ics) est lu par tous les agendas — iPhone, Android,
 * Outlook, Google. Un fichier suffit : l'utilisateur l'ouvre, et son
 * téléphone lui rappellera l'échéance, même s'il ne revient jamais sur le
 * site. C'est le rappel le plus fiable qui soit, parce qu'il vit chez lui.
 */

export type EvenementAgenda = {
  /** Identifiant stable : rouvrir le fichier met à jour l'événement au lieu de le dupliquer. */
  uid: string;
  titre: string;
  /** Jour de l'échéance, au format ISO (AAAA-MM-JJ). */
  date: string;
  description: string;
  /** Rappels, en jours avant l'échéance. */
  rappels?: number[];
  url?: string;
};

/** Échappe le texte selon la RFC 5545 (virgules, points-virgules, retours à la ligne). */
function echapper(texte: string): string {
  return texte.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/**
 * Replie les lignes à 75 octets, comme l'exige la norme — des octets, pas des
 * caractères : un « é » en compte deux, et un agenda strict rejette une ligne
 * trop longue. On ne coupe jamais au milieu d'un caractère.
 */
function plier(ligne: string): string {
  const encodeur = new TextEncoder();
  const morceaux: string[] = [];
  let courant = "";
  let octets = 0;
  for (const car of ligne) {
    const n = encodeur.encode(car).length;
    // Les lignes de continuation commencent par une espace : 74 octets utiles.
    const max = morceaux.length === 0 ? 75 : 74;
    if (octets + n > max) {
      morceaux.push(courant);
      courant = car;
      octets = n;
    } else {
      courant += car;
      octets += n;
    }
  }
  morceaux.push(courant);
  return morceaux.join("\r\n ");
}

export function genererIcs(e: EvenementAgenda, maintenant = new Date()): string {
  const jour = e.date.replace(/-/g, "");
  const lendemain = new Date(`${e.date}T00:00:00Z`);
  lendemain.setUTCDate(lendemain.getUTCDate() + 1);
  const fin = lendemain.toISOString().slice(0, 10).replace(/-/g, "");
  const horodatage = maintenant.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SOS Citizens ASBL//Rappels//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@sos-citizens`,
    `DTSTAMP:${horodatage}`,
    `DTSTART;VALUE=DATE:${jour}`,
    `DTEND;VALUE=DATE:${fin}`,
    `SUMMARY:${echapper(e.titre)}`,
    `DESCRIPTION:${echapper(e.description)}`,
    ...(e.url ? [`URL:${e.url}`] : []),
    "TRANSP:TRANSPARENT",
  ];

  // Chaque rappel déclenche une alarme à 9 h, J jours avant l'échéance.
  // Le jour même (J = 0), l'alarme tombe APRÈS le début de la journée.
  for (const j of e.rappels ?? [3, 1]) {
    const minutes = j * 24 * 60 - 9 * 60;
    lignes.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${echapper(e.titre)}`,
      minutes >= 0 ? `TRIGGER:-PT${minutes}M` : `TRIGGER:PT${-minutes}M`,
      "END:VALARM",
    );
  }

  lignes.push("END:VEVENT", "END:VCALENDAR");
  return lignes.map(plier).join("\r\n") + "\r\n";
}

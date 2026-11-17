/**
 * Le QR code de virement (norme européenne EPC 069-12, « QR SEPA »).
 *
 * Scanné avec l'application d'une banque belge (KBC, Belfius, BNP Paribas
 * Fortis, ING, Argenta…), il remplit tout le virement : bénéficiaire, IBAN,
 * montant et communication. Plus rien à recopier, plus d'erreur de frappe dans
 * l'IBAN ou la référence.
 *
 * Module pur, testé directement : il ne fabrique que le texte encodé.
 */

export type Virement = {
  beneficiaire: string;
  iban: string;
  bic?: string;
  /** En euros ; absent, le donateur choisit le montant dans sa banque. */
  montant?: number | null;
  /** Communication libre, ou communication structurée belge (+++123/4567/89012+++). */
  communication: string;
};

const nettoyer = (s: string, max: number) =>
  s
    .normalize("NFC")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);

/** Le texte que porte le QR code, ligne par ligne selon la norme. */
export function payloadEpc(v: Virement): string {
  const iban = v.iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(iban)) throw new Error("IBAN invalide pour le QR code.");
  const montant =
    v.montant !== undefined && v.montant !== null && Number.isFinite(v.montant) && v.montant > 0
      ? `EUR${Math.min(999999999.99, v.montant).toFixed(2)}`
      : "";
  return [
    "BCD", // en-tête de service
    "002", // version
    "1", // UTF-8
    "SCT", // virement SEPA
    (v.bic ?? "").replace(/\s+/g, "").toUpperCase(),
    nettoyer(v.beneficiaire, 70),
    iban,
    montant,
    "", // code de motif
    "", // référence ISO 11649 (non utilisée : la communication belge va dans le texte)
    nettoyer(v.communication, 140),
  ].join("\n");
}

/** Communication de don lisible par la comptabilité : « DON 2026-11 Awa Diallo ». */
export function communicationDon(nom: string | null | undefined, date = new Date()): string {
  const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const qui = (nom ?? "").replace(/[^\p{L}\p{N} '\-.]/gu, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return qui ? `DON ${mois} ${qui}` : `DON ${mois} SOS Citizens`;
}

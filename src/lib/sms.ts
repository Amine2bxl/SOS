import "server-only";

/**
 * Envoi de SMS par la passerelle textbee : un téléphone Android de
 * l'association, avec un forfait à SMS illimités, envoie les codes.
 *
 * Pourquoi pas Twilio ou Vonage ? Chaque SMS y coûte de 5 à 10 centimes à
 * l'association. textbee (logiciel libre, application Android gratuite) fait
 * partir le SMS depuis la carte SIM de l'association : avec un abonnement à
 * SMS illimités, l'envoi ne coûte rien de plus — et le recevoir est gratuit en
 * Belgique. Gratuit des deux côtés.
 *
 * Configuration : `TEXTBEE_API_KEY` et `TEXTBEE_DEVICE_ID` (tableau de bord
 * textbee.dev, après avoir installé l'application sur le téléphone).
 * `TEXTBEE_URL` permet d'utiliser une instance auto-hébergée.
 */

export const smsConfigure = () => Boolean(process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID);

export async function envoyerSms(destinataire: string, message: string): Promise<{ ok: boolean; raison?: string }> {
  const cle = process.env.TEXTBEE_API_KEY;
  const appareil = process.env.TEXTBEE_DEVICE_ID;
  if (!cle || !appareil) return { ok: false, raison: "non-configure" };
  const base = (process.env.TEXTBEE_URL ?? "https://api.textbee.dev").replace(/\/$/, "");

  try {
    const reponse = await fetch(`${base}/api/v1/gateway/devices/${encodeURIComponent(appareil)}/send-sms`, {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "x-api-key": cle, "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: [destinataire], message }),
    });
    if (!reponse.ok) {
      console.error("Passerelle SMS : refus", reponse.status);
      return { ok: false, raison: "refus" };
    }
    return { ok: true };
  } catch (e) {
    console.error("Passerelle SMS injoignable :", (e as Error).message);
    return { ok: false, raison: "injoignable" };
  }
}

/** Le texte du SMS : court (un seul SMS), sans caractère hors de l'alphabet GSM. */
export const messageCode = (code: string) =>
  `SOS Citizens : votre code est ${code}. Il expire dans 10 minutes. Ne le donnez a personne.`;

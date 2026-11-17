import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Vérification d'un webhook signé au format « Standard Webhooks », celui
 * qu'emploient les crochets d'authentification de Supabase.
 *
 * Le contenu signé est `${id}.${horodatage}.${corps}`, en HMAC-SHA256, avec le
 * secret partagé (`v1,whsec_<base64>`). L'en-tête de signature peut porter
 * plusieurs signatures séparées par des espaces (`v1,<base64> v1,<base64>`),
 * pendant une rotation de secret. Un message de plus de cinq minutes est
 * refusé : on ne rejoue pas un ancien envoi de code.
 */
export function verifierSignatureWebhook({
  secret,
  id,
  horodatage,
  signature,
  corps,
  maintenant = Date.now(),
}: {
  secret: string;
  id: string | null;
  horodatage: string | null;
  signature: string | null;
  corps: string;
  maintenant?: number;
}): boolean {
  if (!secret || !id || !horodatage || !signature) return false;
  const t = Number(horodatage);
  if (!Number.isFinite(t) || Math.abs(maintenant / 1000 - t) > 300) return false;

  const brut = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  let cle: Buffer;
  try {
    cle = Buffer.from(brut, "base64");
  } catch {
    return false;
  }
  if (cle.length === 0) return false;

  const attendue = createHmac("sha256", cle).update(`${id}.${horodatage}.${corps}`).digest();
  return signature.split(" ").some((morceau) => {
    const [version, valeur] = morceau.split(",");
    if (version !== "v1" || !valeur) return false;
    const recue = Buffer.from(valeur, "base64");
    return recue.length === attendue.length && timingSafeEqual(recue, attendue);
  });
}

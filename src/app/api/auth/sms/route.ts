import { verifierSignatureWebhook } from "@/lib/signature-webhook";
import { envoyerSms, messageCode } from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * Crochet « Send SMS » de Supabase : quand quelqu'un demande un code par
 * téléphone, Supabase fabrique le code et nous l'envoie ici, signé ; nous le
 * faisons partir par la passerelle SMS de l'association (voir `lib/sms.ts`).
 *
 * À brancher dans Supabase : Authentication → Hooks → Send SMS → HTTPS,
 * adresse `https://<site>/api/auth/sms`, et le secret généré, recopié dans la
 * variable `SUPABASE_SMS_HOOK_SECRET`.
 */
export async function POST(requete: Request) {
  const secret = process.env.SUPABASE_SMS_HOOK_SECRET ?? "";
  const corps = await requete.text();

  const valide = verifierSignatureWebhook({
    secret,
    id: requete.headers.get("webhook-id"),
    horodatage: requete.headers.get("webhook-timestamp"),
    signature: requete.headers.get("webhook-signature"),
    corps,
  });
  if (!valide) return erreur(401, "Signature invalide.");

  let donnees: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    donnees = JSON.parse(corps);
  } catch {
    return erreur(400, "Corps illisible.");
  }

  const telephone = donnees.user?.phone ? `+${donnees.user.phone.replace(/^\+/, "")}` : null;
  const code = donnees.sms?.otp;
  if (!telephone || !code || !/^\d{4,10}$/.test(code)) return erreur(400, "Numéro ou code manquant.");

  const envoi = await envoyerSms(telephone, messageCode(code));
  if (!envoi.ok) return erreur(502, "Le SMS n'a pas pu partir.");
  return Response.json({});
}

const erreur = (statut: number, message: string) =>
  Response.json({ error: { http_code: statut, message } }, { status: statut });

import "server-only";
import { ASSO } from "@/lib/data";

export type ResultatEnvoi = { ok: true } | { ok: false; raison: "non-configure" | "echec" };

/** Adresse d'expédition, personnalisable sans toucher au code. */
function expediteur(): string {
  return process.env.EMAIL_EXPEDITEUR ?? `${ASSO.nom} <onboarding@resend.dev>`;
}

/** URL publique du site, utilisée dans les e-mails (logo, liens). */
export function urlDuSite(): string {
  const brute = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return brute.replace(/\/+$/, "");
}

/** Vrai quand l'envoi d'e-mails est branché. */
export const mailConfigure = (): boolean => Boolean(process.env.RESEND_API_KEY);

/**
 * Envoi d'un e-mail via l'API HTTP de Resend.
 *
 * Aucune exception ne remonte : un envoi qui échoue est une information que
 * l'appelant affiche à l'utilisateur (« nous n'avons pas pu envoyer le code »),
 * pas une page d'erreur.
 */
export async function envoyerEmail({
  destinataire,
  sujet,
  html,
  texte,
}: {
  destinataire: string;
  sujet: string;
  html: string;
  texte: string;
}): Promise<ResultatEnvoi> {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return { ok: false, raison: "non-configure" };

  try {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: expediteur(),
        to: [destinataire],
        reply_to: ASSO.email,
        subject: sujet,
        html,
        text: texte,
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => "");
      console.error("Envoi d'e-mail refusé par Resend :", reponse.status, detail);
      return { ok: false, raison: "echec" };
    }
    return { ok: true };
  } catch (erreur) {
    console.error("Envoi d'e-mail impossible :", erreur);
    return { ok: false, raison: "echec" };
  }
}

import "server-only";
import { createTransport } from "nodemailer";
import { ASSO } from "@/lib/data";
import { canalEnvoi } from "@/lib/mail/canal";

export type ResultatEnvoi = { ok: true } | { ok: false; raison: "non-configure" | "echec" };

/** URL publique du site, utilisée dans les e-mails (logo, liens) : voir `lib/url-site.ts`. */
export { urlDuSite } from "@/lib/url-site";

/** Vrai quand l'envoi d'e-mails est branché (Resend ou SMTP : voir `canal.ts`). */
export const mailConfigure = (): boolean => canalEnvoi() !== null;

/**
 * Envoi d'un e-mail, par Resend ou par SMTP selon la configuration.
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
  const canal = canalEnvoi();
  if (!canal) return { ok: false, raison: "non-configure" };

  try {
    if (canal.type === "smtp") {
      const transport = createTransport({
        host: canal.hote,
        port: canal.port,
        secure: canal.securise,
        // Jamais d'identifiants en clair : sans TLS d'emblée, STARTTLS est exigé.
        requireTLS: !canal.securise,
        auth: { user: canal.utilisateur, pass: canal.motDePasse },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      });
      await transport.sendMail({
        from: canal.expediteur,
        to: destinataire,
        replyTo: ASSO.email,
        subject: sujet,
        html,
        text: texte,
      });
      return { ok: true };
    }

    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${canal.cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: canal.expediteur,
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
    // Le message seul : l'objet d'erreur SMTP peut porter la commande en cours.
    const e = erreur as { code?: string; responseCode?: number; message?: string };
    console.error(`Envoi d'e-mail impossible (${canal.type}) :`, e.code ?? "", e.responseCode ?? "", e.message ?? String(erreur));
    return { ok: false, raison: "echec" };
  }
}

"use server";

import { headers } from "next/headers";
import { ASSO } from "@/lib/data";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import { envoyerEmail } from "@/lib/mail/envoyer";
import { libelleSujet, validerMessage } from "@/lib/contact";

export type EtatContact = { ok?: boolean; erreur?: string; champ?: string };

async function ipVisiteur(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
}

const echapper = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Le formulaire de contact.
 *
 * Le message est rangé en base (effacé au bout de douze mois) ET transmis par
 * e-mail à l'association, avec l'adresse du visiteur en réponse : un bénévole
 * répond depuis sa messagerie, comme à n'importe quel e-mail. Un seul des deux
 * canaux suffit pour dire « envoyé » ; si aucun ne marche, on le dit et on
 * propose WhatsApp ou l'e-mail direct, plutôt que de laisser croire que le
 * message est parti.
 *
 * Aucun accusé de réception n'est envoyé au visiteur : sinon, n'importe qui
 * pourrait faire envoyer des e-mails de l'association à une adresse tierce.
 */
export async function envoyerMessageContact(_precedent: EtatContact, donnees: FormData): Promise<EtatContact> {
  const brut = Object.fromEntries(donnees.entries());
  const verdict = validerMessage(brut);

  // Un robot reçoit le même « merci » qu'un humain, sans que rien ne parte.
  if (!verdict.ok && "robot" in verdict) return { ok: true };
  if (!verdict.ok) return { erreur: verdict.erreur, champ: verdict.champ };

  const ip = await ipVisiteur();
  if (!(await consommerJeton("contact", `ip:${ip}`))) return { erreur: messageQuotaAtteint("contact") };

  const { nom, email, sujet, message } = verdict.valeur;

  let enregistre = false;
  const admin = creerClientAdmin();
  if (admin) {
    const { error } = await admin.from("messages_contact").insert({ nom, email, sujet, message });
    enregistre = !error;
    if (error) console.error("Message de contact non enregistré :", error.code, error.message);
  }

  const envoi = await envoyerEmail({
    destinataire: ASSO.email,
    repondreA: email,
    sujet: `[Contact] ${libelleSujet(sujet)} — ${nom}`,
    texte: [`De : ${nom} <${email}>`, `Sujet : ${libelleSujet(sujet)}`, "", message].join("\n"),
    html: `<p><strong>De :</strong> ${echapper(nom)} &lt;${echapper(email)}&gt;<br><strong>Sujet :</strong> ${echapper(
      libelleSujet(sujet),
    )}</p><p style="white-space:pre-wrap">${echapper(message)}</p>`,
  });

  if (!enregistre && !envoi.ok) {
    return {
      erreur: `Votre message n'a pas pu partir. Écrivez-nous directement à ${ASSO.email} ou sur WhatsApp au ${ASSO.telephone}.`,
    };
  }
  return { ok: true };
}

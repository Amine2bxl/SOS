"use server";

import { creerClientServeur } from "@/lib/supabase/server";
import { envoyerEmail, mailConfigure } from "@/lib/mail/envoyer";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import { emailValide } from "@/lib/email-canonique";
import { marquerContestationEnvoyee } from "@/lib/dossiers-actions";
import { ASSO } from "@/lib/data";

const OBJETS: Record<string, string> = {
  contestation: "Contestation",
  relance: "Relance",
  reponse_huissier: "Contestation de la créance",
  demande_preuves: "Demande d'accès aux données (RGPD)",
  remboursement: "Demande de remboursement",
  echelonnement: "Demande de plan de paiement",
  bonne_foi: "Demande d'annulation à titre gracieux",
};

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Envoie la lettre d'un dossier par e-mail, au nom du membre.
 *
 * Ce n'est pas un relais ouvert : seule la dernière lettre enregistrée du
 * dossier part (jamais un texte venu du navigateur), vers un seul destinataire,
 * cinq fois par jour au plus. Le membre est en copie et en adresse de réponse :
 * l'organisme lui répond directement, et il garde la trace de l'envoi.
 *
 * parking.brussels refuse les contestations par e-mail depuis le 15 mars 2026 :
 * l'envoi y est bloqué, et le formulaire officiel proposé à la place.
 */
export async function envoyerLettreParEmail(
  dossierId: string,
  destinataireBrut: string,
  accord: boolean,
): Promise<{ erreur?: string; ok?: boolean }> {
  if (!accord) return { erreur: "Cochez la case pour nous autoriser à envoyer la lettre en votre nom." };
  const destinataire = destinataireBrut.trim().toLowerCase();
  if (!emailValide(destinataire)) return { erreur: "Cette adresse e-mail ne semble pas valide." };
  if (/(^|[@.])parking\.brussels$/.test(destinataire)) {
    return {
      erreur: "parking.brussels refuse les contestations par e-mail depuis le 15 mars 2026. Utilisez leur formulaire officiel (onglet « Formulaire officiel »).",
    };
  }
  if (!mailConfigure()) return { erreur: "L'envoi d'e-mails n'est pas encore activé sur le site. Copiez la lettre et envoyez-la depuis votre messagerie." };

  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erreur: "Vous devez être connecté, avec une adresse e-mail sur votre compte." };

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, reference, plaque")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dossier) return { erreur: "Ce dossier est introuvable." };

  const { data: lettre } = await supabase
    .from("lettres")
    .select("type, contenu")
    .eq("dossier_id", dossierId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lettre?.contenu) return { erreur: "Enregistrez d'abord la lettre (bouton « Copier » ou « PDF »)." };
  if (/\[[^\]\n]{2,80}\]/.test(lettre.contenu)) return { erreur: "La lettre contient encore des passages entre crochets à compléter." };

  if (!(await consommerJeton("envoiLettre", user.id))) return { erreur: messageQuotaAtteint("envoiLettre") };

  const { data: profil } = await supabase.from("profiles").select("prenom, nom").eq("id", user.id).maybeSingle();
  const nom = [profil?.prenom, profil?.nom].filter(Boolean).join(" ") || user.email;
  const reference = (dossier as { reference?: string | null }).reference;
  const plaque = (dossier as { plaque?: string | null }).plaque;
  const sujet = [OBJETS[lettre.type as string] ?? "Courrier", reference ? `redevance ${reference}` : null, plaque ? `plaque ${plaque}` : null]
    .filter(Boolean)
    .join(" — ");
  const mention = `Envoyé par l'intermédiaire de ${ASSO.nom}, à la demande de ${nom}. Pour répondre, utilisez simplement « Répondre » : votre réponse lui parviendra directement (${user.email}).`;
  const texte = `${lettre.contenu}\n\n—\n${mention}`;
  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;white-space:pre-wrap;color:#0f1e3d">${echapper(lettre.contenu)}</div><hr style="border:none;border-top:1px solid #e2e7f0;margin:24px 0"><p style="font-family:Arial,sans-serif;font-size:12px;color:#55607a">${echapper(mention)}</p>`;

  const r = await envoyerEmail({ destinataire, sujet, html, texte, repondreA: user.email, copie: user.email });
  if (!r.ok) return { erreur: "L'e-mail n'est pas parti. Réessayez dans quelques minutes, ou envoyez la lettre depuis votre messagerie." };

  const aujourdhui = new Date().toISOString().slice(0, 10);
  await marquerContestationEnvoyee(dossierId, aujourdhui, { mode: "email", reference: `E-mail à ${destinataire}`.slice(0, 80) });
  return { ok: true };
}

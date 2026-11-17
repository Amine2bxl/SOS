"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import { estUuid } from "@/lib/validation";
import { envoyerEmail, urlDuSite } from "@/lib/mail/envoyer";
import { ASSO } from "@/lib/data";
import { TYPES_DOCUMENT, formatMontant, type Dossier } from "@/lib/dossiers-format";
import { libellePortee, validerMandat } from "@/lib/mandats";

export type EtatActionMandat = { ok?: boolean; erreur?: string };

const echapper = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Donner mandat à l'association sur un dossier.
 *
 * Le mandat est enregistré, un événement s'inscrit dans la chronologie, et
 * l'association est prévenue par e-mail avec un lien vers le dossier. L'e-mail
 * ne contient que le strict nécessaire (type de courrier, commune, montant,
 * échéance) : le reste se lit dans l'espace opérateur, qui exige le mandat.
 */
export async function accorderMandat(
  dossierId: string,
  saisie: { portee: string[]; jours: number; message: string; accord: boolean },
): Promise<EtatActionMandat> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  if (!estUuid(dossierId)) return { erreur: "Ce dossier est introuvable." };

  const verdict = validerMandat(saisie);
  if (!verdict.ok) return { erreur: verdict.erreur };
  if (!(await consommerJeton("mandat", user.id))) return { erreur: messageQuotaAtteint("mandat") };

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dossier) return { erreur: "Ce dossier est introuvable." };
  const d = dossier as Dossier;

  const { portee, jours, message } = verdict.valeur;
  const accordeLe = new Date();
  const expireLe = new Date(accordeLe.getTime() + jours * 86_400_000);

  const { error } = await supabase.from("mandats").insert({
    user_id: user.id,
    dossier_id: dossierId,
    portee,
    message,
    accorde_le: accordeLe.toISOString(),
    expire_le: expireLe.toISOString(),
  });
  if (error) {
    return {
      erreur: /duplicate|unique/i.test(error.message)
        ? "Un mandat est déjà en cours pour ce dossier."
        : "Le mandat n'a pas pu être enregistré. Réessayez dans un instant.",
    };
  }

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "statut",
    titre: "Accompagnement demandé à l'association",
    note: `Mandat : ${portee.map(libellePortee).join(", ").toLowerCase()}, jusqu'au ${expireLe.toLocaleDateString("fr-BE")}. Révocable à tout moment.`,
  });

  const lien = `${urlDuSite()}/operateur/${dossierId}`;
  const resume = [
    `Type : ${TYPES_DOCUMENT[d.type_document] ?? d.type_document}`,
    `Commune : ${d.commune ?? "—"}`,
    `Montant : ${formatMontant(d.montant)}`,
    `Échéance : ${d.date_echeance ?? "—"}`,
    `Portée : ${portee.map(libellePortee).join(", ")}`,
    `Durée : ${jours} jours`,
  ];
  await envoyerEmail({
    destinataire: ASSO.email,
    repondreA: user.email ?? undefined,
    sujet: `[Mandat] Accompagnement demandé — ${d.commune ?? "dossier"} ${formatMontant(d.montant)}`,
    texte: [...resume, "", message ? `Message : ${message}` : "", "", `Ouvrir le dossier : ${lien}`].join("\n"),
    html: `<p>${resume.map(echapper).join("<br>")}</p>${
      message ? `<p style="white-space:pre-wrap"><strong>Message :</strong> ${echapper(message)}</p>` : ""
    }<p><a href="${echapper(lien)}">Ouvrir le dossier</a> (accès réservé aux opérateurs, sous mandat).</p>`,
  });

  revalidatePath(`/tableau-de-bord/${dossierId}`);
  return { ok: true };
}

/** Retirer le mandat : l'accès de l'association s'arrête immédiatement. */
export async function revoquerMandat(dossierId: string, mandatId: string): Promise<EtatActionMandat> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  if (!estUuid(dossierId) || !estUuid(mandatId)) return { erreur: "Ce mandat est introuvable." };

  const { data, error } = await supabase
    .from("mandats")
    .update({ revoque_le: new Date().toISOString() })
    .eq("id", mandatId)
    .eq("user_id", user.id)
    .is("revoque_le", null)
    .select("id");
  if (error || !data?.length) return { erreur: "Le mandat n'a pas pu être retiré. Réessayez." };

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "statut",
    titre: "Mandat retiré",
    note: "L'association n'a plus accès à ce dossier.",
  });

  revalidatePath(`/tableau-de-bord/${dossierId}`);
  return { ok: true };
}

import { creerClientAdmin } from "@/lib/supabase/admin";
import { envoyerEmail, mailConfigure, urlDuSite } from "@/lib/mail/envoyer";
import { emailRappel } from "@/lib/mail/gabarits";
import { analyser } from "@/cerveau";
import { faitsDepuisDossier } from "@/lib/faits";
import { rappelDu, TITRES_RAPPEL } from "@/lib/rappels";
import type { Dossier } from "@/lib/dossiers-format";

export const dynamic = "force-dynamic";

/**
 * La tournée du matin : un rappel à chaque dossier qui risque de laisser filer
 * un délai ou une relance.
 *
 * Appelée chaque jour par la tâche planifiée de Vercel (voir `vercel.json`),
 * qui présente le secret `CRON_SECRET`. Sans ce secret, sans la clé
 * `service_role` ou sans l'envoi d'e-mails, la route ne fait rien et le dit :
 * jamais de rappel à moitié envoyé.
 */
export async function GET(requete: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || requete.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ erreur: "non autorisé" }, { status: 401 });
  }

  const admin = creerClientAdmin();
  if (!admin || !mailConfigure()) {
    return Response.json({ erreur: "rappels inactifs : clé service_role ou envoi d'e-mails manquant" }, { status: 503 });
  }

  const { data: dossiers, error } = await admin
    .from("dossiers")
    .select("*")
    .in("statut", ["nouveau", "a_contester", "contestation_envoyee", "en_attente_reponse"])
    .limit(5000);
  if (error) return Response.json({ erreur: "lecture des dossiers impossible" }, { status: 500 });

  const liste = (dossiers ?? []) as Dossier[];
  if (liste.length === 0) return Response.json({ examines: 0, envoyes: 0 });

  // Les rappels déjà partis, et les destinataires, en deux requêtes pour tous.
  const ids = liste.map((d) => d.id);
  const [{ data: dejaPartis }, { data: profils }] = await Promise.all([
    admin
      .from("evenements")
      .select("dossier_id, titre")
      .eq("type", "rappel")
      .in("titre", Object.values(TITRES_RAPPEL))
      .in("dossier_id", ids),
    admin
      .from("profiles")
      .select("id, email, prenom")
      .in("id", Array.from(new Set(liste.map((d) => d.user_id)))),
  ]);

  const partisParDossier = new Map<string, Set<string>>();
  for (const e of (dejaPartis ?? []) as { dossier_id: string; titre: string }[]) {
    if (!partisParDossier.has(e.dossier_id)) partisParDossier.set(e.dossier_id, new Set());
    partisParDossier.get(e.dossier_id)!.add(e.titre);
  }
  const profilParId = new Map(
    ((profils ?? []) as { id: string; email: string | null; prenom: string | null }[]).map((p) => [p.id, p]),
  );

  const site = urlDuSite();
  let envoyes = 0;

  for (const d of liste) {
    const profil = profilParId.get(d.user_id);
    if (!profil?.email) continue;

    const analyse = analyser(faitsDepuisDossier(d));
    const rappel = rappelDu(d, analyse.delai.joursRestants, partisParDossier.get(d.id) ?? new Set());
    if (!rappel) continue;

    const nom = [d.commune || d.crediteur || "Votre dossier", d.reference].filter(Boolean).join(" · ");
    const gabarit = emailRappel({
      prenom: profil.prenom,
      sujet: rappel.sujet,
      message: rappel.message,
      dossier: nom,
      lien: `${site}/tableau-de-bord/${d.id}#${rappel.ancre}`,
      libelleLien: rappel.libelleLien,
      urlSite: site,
    });

    const envoi = await envoyerEmail({ destinataire: profil.email, ...gabarit });
    if (!envoi.ok) continue;

    // Consigné dans l'historique : l'utilisateur le voit, et il ne repartira pas.
    await admin.from("evenements").insert({
      dossier_id: d.id,
      user_id: d.user_id,
      type: "rappel",
      titre: rappel.titre,
      note: rappel.sujet,
    });
    envoyes += 1;
  }

  return Response.json({ examines: liste.length, envoyes });
}

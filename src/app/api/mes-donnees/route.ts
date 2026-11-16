import { creerClientServeur } from "@/lib/supabase/server";
import { DOCUMENTS_LEGAUX } from "@/lib/versions-legales";
import { ASSO } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * « Télécharger mes données » : tout ce que le compte contient, en un fichier.
 *
 * Droit d'accès et droit à la portabilité (RGPD, art. 15 et 20). Le fichier est
 * produit à la demande, avec la session de la personne : les politiques RLS
 * garantissent qu'il ne contient que SES lignes, et chaque requête filtre en
 * plus sur son identifiant. Une table absente (migration à venir) est notée
 * comme telle, sans faire échouer l'export.
 */
export async function GET() {
  const supabase = await creerClientServeur();
  if (!supabase) return Response.json({ erreur: "Service indisponible." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ erreur: "Connectez-vous pour télécharger vos données." }, { status: 401 });

  const lire = async (table: string, colonne = "user_id") => {
    const { data, error } = await supabase.from(table).select("*").eq(colonne, user.id);
    return error ? { indisponible: true } : data;
  };

  const [profil, dossiers, evenements, lettres, adhesions, mandats, consentements, alertesVues] = await Promise.all([
    lire("profiles", "id"),
    lire("dossiers"),
    lire("evenements"),
    lire("lettres"),
    lire("adhesions"),
    lire("mandats"),
    lire("consentements"),
    lire("alertes_vues"),
  ]);

  const maintenant = new Date();
  const contenu = {
    export: {
      genere_le: maintenant.toISOString(),
      responsable_du_traitement: `${ASSO.nom}, ${ASSO.rue}, ${ASSO.codePostal} ${ASSO.ville} — BCE ${ASSO.bce}`,
      contact: ASSO.email,
      documents_en_vigueur: Object.fromEntries(Object.entries(DOCUMENTS_LEGAUX).map(([k, v]) => [k, v.version])),
      note:
        "Ce fichier contient les données de votre compte. Les images et PDF de vos courriers n'y figurent pas : ils sont lus sur votre appareil et ne nous sont jamais envoyés.",
    },
    compte: { id: user.id, email: user.email, cree_le: user.created_at, derniere_connexion: user.last_sign_in_at },
    profil: Array.isArray(profil) ? (profil[0] ?? null) : profil,
    dossiers,
    evenements,
    lettres,
    adhesions,
    mandats,
    consentements,
    alertes_vues: alertesVues,
  };

  return new Response(JSON.stringify(contenu, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sos-citizens-mes-donnees-${maintenant.toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

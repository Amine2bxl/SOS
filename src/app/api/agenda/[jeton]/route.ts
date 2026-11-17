import { creerClientAdmin } from "@/lib/supabase/admin";
import { chargerAgenda } from "@/lib/agenda-donnees";
import { genererCalendrier } from "@/cerveau";
import { urlDuSite } from "@/lib/url-site";
import { estUuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Le flux d'abonnement : `/api/agenda/<jeton>.ics`. Les agendas (Google,
 * Apple, Outlook) le relisent seuls, sans cookie : l'adresse secrète tient lieu
 * de clé. Un jeton inconnu rend un 404, sans plus de détail.
 */
export async function GET(_r: Request, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton: brut } = await params;
  const jeton = brut.replace(/\.ics$/, "");
  if (!estUuid(jeton)) return new Response("Introuvable", { status: 404 });

  const admin = creerClientAdmin();
  if (!admin) return new Response("Indisponible", { status: 503 });
  const { data: profil } = await admin.from("profiles").select("id").eq("agenda_jeton", jeton).maybeSingle();
  if (!profil) return new Response("Introuvable", { status: 404 });

  const an = new Date().getUTCFullYear();
  const evenements = await chargerAgenda(admin, profil.id as string, [an - 1, an, an + 1]);
  const site = urlDuSite();
  // Les jours fériés restent dans l'application : dans l'agenda du téléphone,
  // ils feraient doublon avec le calendrier national.
  const ics = genererCalendrier(
    evenements
      .filter((e) => e.type !== "ferie" && e.type !== "constat")
      .map((e) => ({
        uid: e.id,
        titre: e.titre,
        date: e.date,
        description: [e.detail, e.lien ? `${site}${e.lien}` : null].filter(Boolean).join("\n\n"),
        url: e.lien ? `${site}${e.lien}` : undefined,
        rappels: e.type === "echeance" ? [3, 1, 0] : e.type === "relance" ? [0] : [],
      })),
    "SOS Citizens",
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sos-citizens.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
}

import type { Metadata } from "next";
import { listerDossiers, lireProfil } from "@/lib/dossiers";
import { AtelierLettre, type DossierPourLettre } from "./AtelierLettre";

export const metadata: Metadata = { title: "Rédiger ma lettre" };
export const dynamic = "force-dynamic";

/**
 * Module « Rédiger ma lettre ».
 *
 * Il est branché sur les dossiers : arriver ici depuis un dossier pré-remplit
 * tout ce qu'on connaît déjà (référence, plaque, montant, commune, coordonnées),
 * et la lettre terminée se range dans le dossier. C'est ce qui en fait un
 * module de l'espace membre et non un formulaire isolé.
 */
export default async function LettrePage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>;
}) {
  const [{ dossier: dossierId }, dossiers, profil] = await Promise.all([
    searchParams,
    listerDossiers(),
    lireProfil(),
  ]);

  const utilisables: DossierPourLettre[] = dossiers
    .filter((d) => !["accepte", "clos"].includes(d.statut))
    .map((d) => ({
      id: d.id,
      libelle: `${d.reference ?? "Dossier sans référence"}${d.commune ? ` — ${d.commune}` : ""}`,
      reference: d.reference ?? "",
      plaque: d.plaque ?? "",
      montant: d.montant !== null ? String(d.montant) : "",
      dateConstat: d.date_constat ?? "",
      commune: d.commune ?? "",
      motif: d.motif ?? "",
      explication: d.explication ?? "",
      dejaRedigee: Boolean(d.lettre),
    }));

  return (
    <AtelierLettre
      dossiers={utilisables}
      dossierInitial={utilisables.some((d) => d.id === dossierId) ? (dossierId ?? null) : null}
      profil={{
        prenom: profil?.prenom ?? "",
        nom: profil?.nom ?? "",
        adresse: profil?.adresse ?? "",
        codePostal: profil?.code_postal ?? "",
        ville: profil?.commune ?? "",
        email: profil?.email ?? "",
      }}
    />
  );
}

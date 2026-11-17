/**
 * Les chiffres de l'association, calculés à partir des dossiers et des
 * comptes — sans aucune donnée personnelle dans le résultat : des totaux, des
 * taux, des communes, des mois.
 *
 * Module pur, testé directement. La page des statistiques (réservée aux
 * bénévoles) lit la base avec la clé de service et passe les lignes ici.
 */

export type LigneDossier = {
  statut: string;
  montant: number | null;
  commune: string | null;
  created_at: string;
};
export type LigneProfil = { plan: string | null; created_at: string };
export type LigneAdhesion = { statut: string; montant: number | null };

export type Statistiques = {
  dossiers: { total: number; enCours: number; envoyes: number; annules: number; rejetes: number; clos: number };
  /** Annulés ÷ (annulés + rejetés) ; null tant qu'aucune réponse n'est connue. */
  tauxReussite: number | null;
  montants: { conteste: number; annule: number };
  communes: { nom: string; n: number }[];
  /** Les douze derniers mois, du plus ancien au plus récent. */
  parMois: { cle: string; libelle: string; n: number }[];
  membres: { comptes: number; payants: number; nouveauxCeMois: number };
  adhesions: { enAttente: number; payees: number; encaisse: number };
};

const EN_COURS = new Set(["nouveau", "a_contester"]);
const ENVOYES = new Set(["contestation_envoyee", "en_attente_reponse"]);
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function calculerStatistiques(
  dossiers: LigneDossier[],
  profils: LigneProfil[],
  adhesions: LigneAdhesion[],
  aujourdhui = new Date(),
): Statistiques {
  const compter = (f: (d: LigneDossier) => boolean) => dossiers.filter(f).length;
  const annules = compter((d) => d.statut === "accepte");
  const rejetes = compter((d) => d.statut === "rejete");

  const parCommune = new Map<string, number>();
  for (const d of dossiers) {
    const nom = d.commune?.trim();
    if (nom) parCommune.set(nom, (parCommune.get(nom) ?? 0) + 1);
  }

  const parMois = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth() - 11 + i, 1));
    const cle = date.toISOString().slice(0, 7);
    return { cle, libelle: MOIS[date.getUTCMonth()], n: 0 };
  });
  const indexMois = new Map(parMois.map((m, i) => [m.cle, i]));
  for (const d of dossiers) {
    const i = indexMois.get(d.created_at.slice(0, 7));
    if (i !== undefined) parMois[i].n++;
  }

  const ceMois = aujourdhui.toISOString().slice(0, 7);
  const somme = (lignes: { montant: number | null }[]) => Math.round(lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0) * 100) / 100;

  return {
    dossiers: {
      total: dossiers.length,
      enCours: compter((d) => EN_COURS.has(d.statut)),
      envoyes: compter((d) => ENVOYES.has(d.statut)),
      annules,
      rejetes,
      clos: compter((d) => d.statut === "clos"),
    },
    tauxReussite: annules + rejetes > 0 ? annules / (annules + rejetes) : null,
    montants: { conteste: somme(dossiers), annule: somme(dossiers.filter((d) => d.statut === "accepte")) },
    communes: [...parCommune.entries()].map(([nom, n]) => ({ nom, n })).sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom)).slice(0, 8),
    parMois,
    membres: {
      comptes: profils.length,
      payants: profils.filter((p) => p.plan && p.plan !== "gratuit").length,
      nouveauxCeMois: profils.filter((p) => p.created_at.slice(0, 7) === ceMois).length,
    },
    adhesions: {
      enAttente: adhesions.filter((a) => a.statut === "en_attente").length,
      payees: adhesions.filter((a) => a.statut === "payee").length,
      encaisse: somme(adhesions.filter((a) => a.statut === "payee")),
    },
  };
}

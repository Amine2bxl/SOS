"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { accepterConditions } from "@/lib/consentements-actions";
import { DOCUMENTS_LEGAUX, type DocumentLegal } from "@/lib/versions-legales";
import { Modale } from "@/components/Modale";
import { Btn } from "@/components/ui";

/**
 * Avant d'utiliser l'espace membre : lire et accepter les documents en vigueur.
 *
 * Deux cases distinctes, une action positive par document : c'est ce qui rend
 * l'acceptation valable (RGPD, art. 7). La fenêtre revient quand une version
 * change ; elle ne se ferme pas sans réponse, mais rien n'empêche de quitter
 * le site — ni de lire les documents avant de cocher.
 */
export function AccordConditions({ documents, premiereFois }: { documents: DocumentLegal[]; premiereFois: boolean }) {
  const router = useRouter();
  const [coches, setCoches] = useState<DocumentLegal[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const [ouverte, setOuverte] = useState(true);
  const tout = documents.every((d) => coches.includes(d));

  const basculer = (d: DocumentLegal) =>
    setCoches((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d]));

  return (
    <Modale ouverte={ouverte} onFermer={() => {}} fermable={false} titre="Conditions" largeur="max-w-md">
      <h2 className="font-display text-xl font-extrabold text-navy-900">
        {premiereFois ? "Avant de commencer" : "Nos conditions ont évolué"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {premiereFois
          ? "Deux documents encadrent votre espace : ce que nous faisons de vos données, et les règles du service. Prenez le temps de les lire."
          : "Une nouvelle version est en vigueur. Votre acceptation précédente reste enregistrée ; celle-ci s'y ajoute."}
      </p>
      <div className="mt-5 space-y-2.5">
        {documents.map((d) => {
          const doc = DOCUMENTS_LEGAUX[d];
          return (
            <label key={d} className="flex items-start gap-3 rounded-2xl bg-paper p-3.5 text-sm leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={coches.includes(d)}
                onChange={() => basculer(d)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-navy-900"
              />
              <span>
                {d === "cgu" ? "J'accepte les " : "J'ai lu la "}
                <a href={doc.chemin} target="_blank" rel="noopener" className="font-semibold text-navy-700 underline underline-offset-4">
                  {d === "cgu" ? "conditions d'utilisation" : "politique de confidentialité"}
                </a>
                <span className="block text-xs text-ink-faint">Version {doc.version}</span>
              </span>
            </label>
          );
        })}
      </div>
      {erreur && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger-700">
          {erreur}
        </p>
      )}
      <Btn
        variant="primary"
        className="mt-5 w-full"
        disabled={!tout || enCours}
        onClick={() =>
          demarrer(async () => {
            setErreur(null);
            const r = await accepterConditions(coches);
            if (r.erreur) return setErreur(r.erreur);
            setOuverte(false);
            router.refresh();
          })
        }
      >
        {enCours ? "Enregistrement…" : "Continuer"}
      </Btn>
    </Modale>
  );
}

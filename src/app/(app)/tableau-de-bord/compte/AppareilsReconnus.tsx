"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retirerAppareil, seDeconnecterEtOublier } from "@/lib/connexion-actions";
import { Btn } from "@/components/ui";

export type Appareil = { id: string; libelle: string | null; utilise_le: string; actuel: boolean };

/**
 * Les appareils où l'on entre sans code. Un téléphone perdu, un ordinateur
 * prêté : on le retire d'ici, et il redemandera un code.
 */
export function AppareilsReconnus({ appareils }: { appareils: Appareil[] }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div>
      {appareils.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucun appareil retenu pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {appareils.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3.5">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-navy-900">
                  {a.libelle ?? "Appareil"}
                  {a.actuel && <span className="ml-2 rounded-full bg-ok-100 px-2 py-0.5 text-xs font-bold text-ok-700">Celui-ci</span>}
                </span>
                <span className="block text-xs text-ink-faint">
                  Dernière fois : {new Date(a.utilise_le).toLocaleDateString("fr-BE")}
                </span>
              </span>
              <Btn
                variant="dangerDiscret"
                taille="sm"
                disabled={enCours}
                onClick={() =>
                  demarrer(async () => {
                    setErreur(null);
                    const r = await retirerAppareil(a.id);
                    if (r.erreur) return setErreur(r.erreur);
                    router.refresh();
                  })
                }
              >
                Retirer
              </Btn>
            </li>
          ))}
        </ul>
      )}
      {erreur && (
        <p role="alert" className="mt-2 text-sm text-danger-700">
          {erreur}
        </p>
      )}
      <form action={seDeconnecterEtOublier} className="mt-3">
        <button type="submit" className="text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900">
          Ordinateur partagé ? Se déconnecter et oublier cet appareil
        </button>
      </form>
    </div>
  );
}

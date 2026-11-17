"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { effacerBrouillon, lireBrouillon, type Brouillon } from "@/components/scan/brouillon";
import { IconeFleche } from "@/components/icones";

/**
 * Une analyse faite sans compte attend d'être reprise.
 *
 * Le visiteur a scanné sa lettre sur la page d'accueil, puis créé son compte
 * — par le bouton prévu, ou par un autre chemin (« Se connecter » en haut de
 * page, un lien reçu par e-mail). Où qu'il arrive dans son espace, son
 * analyse l'attend ici : un geste, et elle devient un dossier, sans reprendre
 * la photo ni répondre deux fois aux mêmes questions.
 */
export function RepriseBrouillon() {
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  useEffect(() => {
    // Le brouillon vit dans le navigateur : on ne peut le lire qu'une fois la page affichée.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrouillon(lireBrouillon());
  }, []);
  if (!brouillon) return null;

  const { form } = brouillon;
  const resume = [form.plaque, form.montant && `${form.montant} €`, form.commune].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:pt-6">
      <div role="status" className="flex flex-col gap-3 rounded-[var(--radius-carte)] border border-gold-400/60 bg-gold-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight text-navy-900">Votre lettre vous attend</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            L&apos;analyse faite avant de créer votre compte est gardée{resume ? ` : ${resume}` : ""}. Rien à refaire.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              effacerBrouillon();
              setBrouillon(null);
            }}
            className="text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-navy-900"
          >
            Ignorer
          </button>
          <Link
            href="/tableau-de-bord/nouveau?reprise=1"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gold-400 px-5 text-sm font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300 active:scale-[0.97]"
          >
            Créer mon dossier
            <IconeFleche className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

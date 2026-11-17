"use client";

import { useMemo, useState } from "react";
import { QrVirement } from "@/components/QrVirement";
import { CopierTexte } from "@/components/CopierTexte";
import { communicationDon } from "@/lib/virement-qr";

const MONTANTS = [10, 25, 50, 100];

/**
 * Le virement de don, prêt à scanner : on choisit un montant (ou pas), on
 * indique son nom si on veut un merci personnel, et le QR code se met à jour.
 * La communication « DON 2026-11 Prénom Nom » permet à la trésorerie de
 * l'association de ranger chaque don sans rien demander.
 */
export function DonVirement({ iban, bic, beneficiaire }: { iban: string; bic?: string; beneficiaire: string }) {
  const [montant, setMontant] = useState<number | null>(25);
  const [libre, setLibre] = useState("");
  const [nom, setNom] = useState("");
  const communication = useMemo(() => communicationDon(nom), [nom]);
  const montantFinal = libre ? Number(libre.replace(",", ".")) || null : montant;

  return (
    <div className="mt-6 rounded-2xl bg-white/[0.06] p-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <QrVirement virement={{ iban, bic, beneficiaire, montant: montantFinal, communication }} taille={148} className="shrink-0 p-1.5" />
        <div className="w-full min-w-0 space-y-3">
          <p className="text-sm leading-snug text-navy-100">Scannez avec l&apos;application de votre banque : tout est déjà rempli.</p>
          <fieldset>
            <legend className="text-xs text-navy-100">Montant</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MONTANTS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={!libre && montant === m}
                  onClick={() => {
                    setLibre("");
                    setMontant(m);
                  }}
                  className={`h-9 rounded-full px-3 text-sm font-bold transition active:scale-[0.97] ${
                    !libre && montant === m ? "bg-gold-400 text-navy-950" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {m} €
                </button>
              ))}
              <input
                inputMode="decimal"
                value={libre}
                onChange={(e) => setLibre(e.target.value.replace(/[^\d,.]/g, ""))}
                placeholder="Autre"
                aria-label="Autre montant, en euros"
                className="h-9 w-20 rounded-full bg-white/10 px-3 text-sm text-white placeholder:text-navy-100/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-gold-300"
              />
            </div>
          </fieldset>
          <label className="block">
            <span className="text-xs text-navy-100">Votre nom (facultatif, pour vous remercier)</span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={60}
              autoComplete="name"
              className="mt-1 h-10 w-full rounded-xl bg-white/10 px-3 text-sm text-white placeholder:text-navy-100/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-gold-300"
              placeholder="Prénom Nom"
            />
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="min-w-0">
          <span className="block text-xs text-navy-100">Communication</span>
          <span className="block truncate font-semibold">{communication}</span>
        </span>
        <CopierTexte valeur={communication} libelle="Copier la communication" />
      </div>
    </div>
  );
}
